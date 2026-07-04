from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from auth import (
    UserLogin, UserRegister, User, Token,
    get_password_hash, verify_password, create_access_token,
    get_current_user, is_admin_user
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Connecting to MongoDB...")
    yield
    # Shutdown
    logger.info("Closing MongoDB connection...")
    client.close()

# Create the main app with lifespan
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Product(BaseModel):
    id: Optional[str] = None
    product_id: Optional[str] = None  # Optional to handle existing products without ID
    name: str
    category: str
    price: float
    stock: int
    description: Optional[str] = None
    image: Optional[str] = None
    images: Optional[List[str]] = None  # Store up to 5 images as base64 strings

class Order(BaseModel):
    id: Optional[str] = None
    customer_email: str
    items: List[dict]
    total: float
    status: str  # 'Processing', 'WhatsApp Sent', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'
    date: Optional[str] = None
    shipping_info: Optional[dict] = None
    order_method: str = 'online'  # 'online' or 'whatsapp'
    whatsapp_sent: bool = False
    admin_whatsapp: Optional[str] = None  # Admin WhatsApp number
    cancellation_reason: Optional[str] = None
    cancelled_by: Optional[str] = None  # 'user' or 'admin'
    cancelled_at: Optional[str] = None  # Timestamp of cancellation
    delivered_at: Optional[str] = None  # Timestamp when order was delivered
    return_requested: bool = False  # Whether a return has been requested
    return_reason: Optional[str] = None  # Reason for return request
    return_requested_at: Optional[str] = None  # Timestamp of return request
    return_status: Optional[str] = None  # 'Pending', 'Approved', 'Rejected', 'Processed'

class Customer(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    orders: int = 0
    spent: float = 0
    joined: Optional[str] = None

class Wishlist(BaseModel):
    id: Optional[str] = None
    user_email: Optional[str] = None  # Optional - backend will set from current_user
    product_id: str
    product_name: str
    price: float
    category: str
    image: str
    rating: Optional[float] = None
    reviews: Optional[int] = None
    added_date: Optional[str] = None

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# Authentication routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = {
        "id": str(uuid.uuid4()),
        "name": user_data.name,
        "email": user_data.email,
        "password": get_password_hash(user_data.password),
        "is_admin": is_admin_user(user_data.email),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    # Return token and user info (without password)
    user_response = {
        "id": user_dict["id"],
        "name": user_dict["name"],
        "email": user_dict["email"],
        "is_admin": user_dict["is_admin"]
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["email"]})
    
    # Return token and user info (without password)
    user_response = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "is_admin": is_admin_user(user["email"])
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@api_router.get("/auth/me")
async def get_current_user_info(current_user_email: str = Depends(get_current_user)):
    """Get current user information"""
    user = await db.users.find_one({"email": current_user_email}, {"_id": 0, "password": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add is_admin field to response
    user["is_admin"] = is_admin_user(user["email"])
    
    return user

# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products():
    """Get all products"""
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    # Ensure all products have product_id field (for backward compatibility)
    for product in products:
        if not product.get("product_id") and product.get("id"):
            product["product_id"] = product["id"]
    
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    try:
        product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
        
        # Fallback: try searching by id field if product_id not found (backward compatibility)
        if not product:
            product = await db.products.find_one({"id": product_id}, {"_id": 0})
            if product and not product.get("product_id"):
                product["product_id"] = product_id
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching product: {str(e)}"
        )

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get reviews for a product"""
    try:
        # Try to get reviews collection
        reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
        return reviews
    except Exception as e:
        logger.error(f"Error fetching reviews for product {product_id}: {str(e)}")
        return []  # Return empty list if no reviews

@api_router.post("/products/{product_id}/reviews")
async def add_review(product_id: str, review: dict, current_user: str = Depends(get_current_user)):
    """Add a review for a product"""
    try:
        review_dict = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "customerName": current_user,
            "rating": review.get("rating", 5),
            "title": review.get("title", ""),
            "comment": review.get("comment", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.reviews.insert_one(review_dict)
        logger.info(f"Review added for product {product_id}")
        return review_dict
    except Exception as e:
        logger.error(f"Error adding review: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add review: {str(e)}"
        )

@api_router.post("/products/check-stock")
async def check_stock(items: List[dict]):
    """Check stock availability for multiple items"""
    try:
        stock_info = []
        
        # Debug: Log all products in database
        all_products = await db.products.find({}, {"_id": 0, "id": 1, "product_id": 1, "name": 1, "stock": 1}).to_list(100)
        logger.info(f"DEBUG: All products in DB: {all_products}")
        
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 0)
            
            logger.info(f"Checking stock for product_id: {product_id}, quantity: {quantity}")
            
            product = None
            
            # Strategy 1: Query by product_id field (exact match)
            product = await db.products.find_one({"product_id": product_id})
            if product:
                logger.info(f"✓ Found by product_id field: {product_id}")
            
            # Strategy 2: Query by id field (exact match)
            if not product:
                product = await db.products.find_one({"id": product_id})
                if product:
                    logger.info(f"✓ Found by id field: {product_id}")
            
            # Strategy 3: Case-insensitive search on product_id
            if not product:
                product = await db.products.find_one({"product_id": re.compile(f"^{re.escape(product_id)}$", re.IGNORECASE)})
                if product:
                    logger.info(f"✓ Found by case-insensitive product_id: {product_id}")
            
            # Strategy 4: Search all products and match
            if not product:
                all_products_for_search = await db.products.find({}, {"_id": 0}).to_list(100)
                for p in all_products_for_search:
                    if p.get("id") == product_id or p.get("product_id") == product_id:
                        product = p
                        logger.info(f"✓ Found by full scan: {product_id}")
                        break
            
            if not product:
                logger.error(f"✗ Product NOT found in any search: {product_id}")
                logger.error(f"  Searched for: id={product_id} OR product_id={product_id}")
                stock_info.append({
                    "product_id": product_id,
                    "available": 0,
                    "requested": quantity,
                    "in_stock": False,
                    "name": f"Product not found: {quantity} available, {quantity}"
                })
            else:
                available = product.get("stock", 0)
                product_name = product.get("name", "Unknown")
                logger.info(f"✓ Stock found - {product_name}: {available} available (need {quantity})")
                
                stock_info.append({
                    "product_id": product_id,
                    "available": available,
                    "requested": quantity,
                    "in_stock": available >= quantity,
                    "name": product_name,
                    "low_stock": available > 0 and available <= 5
                })
        
        all_in_stock = all(item["in_stock"] for item in stock_info)
        logger.info(f"Stock check result: all_in_stock={all_in_stock}")
        return {"items": stock_info, "all_in_stock": all_in_stock}
    except Exception as e:
        logger.error(f"Error checking stock: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error checking stock: {str(e)}"
        )

@api_router.post("/products")
async def create_product(product: Product, current_user: dict = Depends(get_current_user)):
    """Create a new product (admin only)"""
    try:
        # Check if user is admin
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Check if product_id is provided
        if not product.product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product ID is required"
            )
        
        # Check if product_id already exists
        existing = await db.products.find_one({"product_id": product.product_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product ID '{product.product_id}' already exists. Please use a unique ID."
            )
        
        product_dict = product.model_dump()
        product_dict["id"] = str(uuid.uuid4())
        product_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        
        # Limit to 5 images
        if product_dict.get("images") and len(product_dict["images"]) > 5:
            product_dict["images"] = product_dict["images"][:5]
        
        result = await db.products.insert_one(product_dict)
        logger.info(f"Product created: {product_dict['id']} with unique ID: {product.product_id}")
        # Fetch the inserted product without the MongoDB _id field
        created_product = await db.products.find_one({"id": product_dict["id"]}, {"_id": 0})
        return created_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create product: {str(e)}"
        )

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: Product, current_user: dict = Depends(get_current_user)):
    """Update a product (admin only)"""
    try:
        if not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Fetch original product to preserve its id field
        original_product = await db.products.find_one({"product_id": product_id})
        if not original_product:
            original_product = await db.products.find_one({"id": product_id})
        
        if not original_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        product_dict = product.model_dump()
        
        # CRITICAL: Remove id from request body to prevent None from overwriting database value
        product_dict.pop("id", None)
        
        # Preserve the original id - ensure it's never null
        original_id = original_product.get("id")
        if not original_id:
            # If id is missing or null, generate a new UUID
            original_id = str(uuid.uuid4())
        
        # Set the original id back
        product_dict["id"] = original_id
        product_dict["product_id"] = product_id
        
        # Limit to 5 images
        if product_dict.get("images") and len(product_dict["images"]) > 5:
            product_dict["images"] = product_dict["images"][:5]
        
        # Update by product_id (primary identifier)
        result = await db.products.update_one(
            {"product_id": product_id},
            {"$set": product_dict}
        )
        
        # Fallback: if no product_id field, try by id field (backward compatibility)
        if result.matched_count == 0:
            result = await db.products.update_one(
                {"id": product_id},
                {"$set": product_dict}
            )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        updated_product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
        if not updated_product:
            updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
        
        logger.info(f"Product updated: {product_id}")
        return updated_product
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update product: {str(e)}"
        )

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a product (admin only)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Try deleting by product_id first
    result = await db.products.delete_one({"product_id": product_id})
    
    # Fallback: if no product_id field, try by id field (backward compatibility)
    if result.deleted_count == 0:
        result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return {"message": "Product deleted successfully"}

# Order Routes
@api_router.get("/orders")
async def get_all_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders (admin) or user's orders (regular user)"""
    if is_admin_user(current_user):
        # Admin sees all orders
        orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    else:
        # Regular user sees only their orders
        orders = await db.orders.find({"customer_email": current_user}, {"_id": 0}).to_list(1000)
    
    # Ensure delivered_at is set for orders with Delivered status
    for order in orders:
        if order.get("status") == "Delivered" and not order.get("delivered_at"):
            # Set delivered_at to current time if not already set
            delivered_at = datetime.now(timezone.utc).isoformat()
            order["delivered_at"] = delivered_at
            # Also update in database
            await db.orders.update_one(
                {"id": order["id"]},
                {"$set": {"delivered_at": delivered_at}}
            )
    
    return orders

@api_router.post("/orders")
async def create_order(order: Order, current_user: dict = Depends(get_current_user)):
    """Create a new order"""
    # Validate stock for all items before creating order
    for item in order.items:
        # Try to find product by product_id first, then by id
        product_id = item.get("product_id") or item.get("id")
        product = await db.products.find_one({"product_id": product_id})
        if not product:
            # Try by id field as fallback
            product = await db.products.find_one({"id": product_id})
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product_id} not found"
            )
        
        if product.get("stock", 0) < item.get("quantity", 0):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.get('name')}. Available: {product.get('stock', 0)}, Requested: {item.get('quantity', 0)}"
            )
        
        # Deduct stock from product - update both by product_id and id for safety
        update_query = {"product_id": product_id}
        await db.products.update_one(
            update_query,
            {"$inc": {"stock": -item.get("quantity", 0)}}
        )
    
    order_dict = order.model_dump()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["customer_email"] = current_user
    order_dict["date"] = datetime.now(timezone.utc).isoformat()
    
    await db.orders.insert_one(order_dict)
    # Fetch the inserted order without the MongoDB _id field
    created_order = await db.orders.find_one({"id": order_dict["id"]}, {"_id": 0})
    return created_order

@api_router.post("/orders/{order_id}/send-whatsapp")
async def send_order_whatsapp(order_id: str, current_user: str = Depends(get_current_user)):
    """Send order details through WhatsApp"""
    try:
        # Fetch the order
        order = await db.orders.find_one({"id": order_id})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if user is the order owner or admin
        if order["customer_email"] != current_user and not is_admin_user(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only send your own orders"
            )
        
        # Get admin WhatsApp number from environment
        admin_whatsapp = os.environ.get('ADMIN_WHATSAPP', '+1234567890')
        
        # Build WhatsApp message
        items_text = "\n".join([
            f"- {item['name']} (ID: {item.get('product_id', 'N/A')})\n  Qty: {item['quantity']} x ₹{item['price']:.2f} = ₹{item['quantity'] * item['price']:.2f}"
            for item in order.get('items', [])
        ])
        
        shipping_info = order.get('shipping_info', {})
        message = f"""
*New Order from Ready2Buy*

Order ID: {order_id}
Customer: {shipping_info.get('fullName', 'N/A')}
Email: {order['customer_email']}
Phone: {shipping_info.get('phone', 'N/A')}

*Items:*
{items_text}

*Shipping Address:*
{shipping_info.get('address', 'N/A')}
{shipping_info.get('city', 'N/A')}, {shipping_info.get('state', 'N/A')} {shipping_info.get('zipCode', 'N/A')}
Country: {shipping_info.get('country', 'N/A')}

Subtotal: ₹{order.get('total', 0):.2f}
Status: Pending Confirmation
"""
        
        # Update order status
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "status": "WhatsApp Sent",
                "whatsapp_sent": True,
                "admin_whatsapp": admin_whatsapp,
                "whatsapp_sent_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Order {order_id} sent through WhatsApp to {admin_whatsapp}")
        
        return {
            "message": "Order sent to WhatsApp successfully",
            "order_id": order_id,
            "status": "WhatsApp Sent",
            "whatsapp_link": f"https://wa.me/{admin_whatsapp.replace('+', '')}?text={message.replace(' ', '%20').replace('\n', '%0A')}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending order to WhatsApp: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to send order: {str(e)}"
        )

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order: Order, current_user: dict = Depends(get_current_user)):
    """Update order status (admin only)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Fetch existing order to check if it's being cancelled
    existing_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check if order status is changing to Cancelled
    new_status = order.status
    old_status = existing_order.get("status")
    
    if old_status != "Cancelled" and new_status == "Cancelled":
        # Restore stock for all items since order is being cancelled
        for item in existing_order.get("items", []):
            product_id = item.get("product_id")
            quantity = item.get("quantity", 0)
            
            # Add stock back to the product
            await db.products.update_one(
                {"id": product_id},
                {"$inc": {"stock": quantity}}
            )
    
    order_dict = order.model_dump()
    
    # If status is being set to "Delivered", set delivered_at timestamp
    if new_status == "Delivered" and old_status != "Delivered":
        order_dict["delivered_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": order_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated_order

@api_router.put("/orders/{order_id}/cancel", response_model=Order)
async def cancel_order_by_user(order_id: str, order: Order, current_user: str = Depends(get_current_user)):
    """Cancel order by user"""
    # Check if order belongs to current user
    existing_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    
    if not existing_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if existing_order.get("customer_email") != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own orders"
        )
    
    # Only allow cancellation for certain statuses
    allowed_statuses = ["Processing", "WhatsApp Sent", "Confirmed"]
    if existing_order.get("status") not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status: {existing_order.get('status')}"
        )
    
    # Restore stock for all items in the order
    for item in existing_order.get("items", []):
        product_id = item.get("product_id")
        quantity = item.get("quantity", 0)
        
        # Add stock back to the product
        await db.products.update_one(
            {"id": product_id},
            {"$inc": {"stock": quantity}}
        )
    
    order_dict = order.model_dump()
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": order_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated_order

@api_router.post("/orders/{order_id}/request-return")
async def request_return(order_id: str, return_data: dict, current_user: str = Depends(get_current_user)):
    """Request return for a delivered order"""
    try:
        # Fetch the order
        order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if user is the order owner
        if order["customer_email"] != current_user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only request returns for your own orders"
            )
        
        # Check if order is delivered
        if order.get("status") != "Delivered":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only request returns for delivered orders"
            )
        
        # Check if return window is still open (7 days)
        from datetime import timedelta
        delivered_at = order.get("delivered_at")
        if delivered_at:
            delivered_date = datetime.fromisoformat(delivered_at)
            days_passed = (datetime.now(timezone.utc) - delivered_date).days
            if days_passed > 7:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Return window closed. Only 7 days allowed after delivery. {days_passed} days have passed."
                )
        
        # Check if already returned or return requested
        if order.get("return_requested"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Return already requested for this order"
            )
        
        # Update order with return request
        result = await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "return_requested": True,
                "return_reason": return_data.get("reason", ""),
                "return_requested_at": datetime.now(timezone.utc).isoformat(),
                "return_status": "Pending"
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        return {
            "message": "Return request submitted successfully",
            "order": updated_order
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting return: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to request return: {str(e)}"
        )

@api_router.get("/admin/return-requests")
async def get_return_requests(current_user: str = Depends(get_current_user)):
    """Get all return requests (admin only)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Fetch all orders with return requests
        return_requests = await db.orders.find(
            {"return_requested": True},
            {"_id": 0}
        ).sort("return_requested_at", -1).to_list(1000)
        
        return return_requests
    except Exception as e:
        logger.error(f"Error fetching return requests: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch return requests: {str(e)}"
        )

@api_router.put("/admin/return-requests/{order_id}")
async def update_return_status(order_id: str, status_data: dict, current_user: str = Depends(get_current_user)):
    """Update return request status (admin only)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        new_status = status_data.get("return_status")
        notes = status_data.get("notes", "")
        
        if new_status not in ["Pending", "Approved", "Rejected", "Processed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid return status"
            )
        
        update_data = {
            "return_status": new_status
        }
        
        if notes:
            update_data["admin_return_notes"] = notes
        
        result = await db.orders.update_one(
            {"id": order_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
        return {
            "message": f"Return status updated to {new_status}",
            "order": updated_order
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating return status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update return status: {str(e)}"
        )

# Customer Routes
@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    """Get all customers (admin only)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    return customers

@api_router.post("/customers", response_model=Customer)
async def create_customer(customer: Customer, current_user: dict = Depends(get_current_user)):
    """Create a new customer record"""
    customer_dict = customer.model_dump()
    customer_dict["id"] = str(uuid.uuid4())
    customer_dict["joined"] = datetime.now(timezone.utc).isoformat()
    
    await db.customers.insert_one(customer_dict)
    # Fetch the inserted customer without the MongoDB _id field
    created_customer = await db.customers.find_one({"id": customer_dict["id"]}, {"_id": 0})
    return created_customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer: Customer, current_user: dict = Depends(get_current_user)):
    """Update customer info (admin only)"""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    customer_dict = customer.model_dump()
    result = await db.customers.update_one(
        {"id": customer_id},
        {"$set": customer_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    updated_customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return updated_customer

# Wishlist Routes
@api_router.get("/wishlist", response_model=list)
async def get_wishlist(current_user: str = Depends(get_current_user)):
    """Get user's wishlist"""
    wishlist_items = await db.wishlist.find({"user_email": current_user}, {"_id": 0}).to_list(1000)
    return wishlist_items

@api_router.post("/wishlist")
async def add_to_wishlist(item: Wishlist, current_user: str = Depends(get_current_user)):
    """Add item to wishlist"""
    item_dict = item.model_dump()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["user_email"] = current_user
    item_dict["added_date"] = datetime.now(timezone.utc).isoformat()
    
    # Check if item already in wishlist
    existing = await db.wishlist.find_one({
        "user_email": current_user,
        "product_id": item_dict["product_id"]
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item already in wishlist"
        )
    
    await db.wishlist.insert_one(item_dict)
    created_item = await db.wishlist.find_one({"id": item_dict["id"]}, {"_id": 0})
    return created_item

@api_router.delete("/wishlist/{item_id}")
async def remove_from_wishlist(item_id: str, current_user: str = Depends(get_current_user)):
    """Remove item from wishlist"""
    result = await db.wishlist.delete_one({
        "id": item_id,
        "user_email": current_user
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found"
        )
    
    return {"message": "Item removed from wishlist"}

@api_router.delete("/wishlist")
async def clear_wishlist(current_user: str = Depends(get_current_user)):
    """Clear entire wishlist"""
    result = await db.wishlist.delete_many({
        "user_email": current_user
    })
    
    return {"message": f"Cleared {result.deleted_count} items from wishlist"}
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Ready2Buy backend server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")