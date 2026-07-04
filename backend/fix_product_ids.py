import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid
from pathlib import Path

async def fix_null_ids():
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Find all products with null or missing id
        products = await db.products.find({'id': None}).to_list(None)
        
        print(f'Found {len(products)} products with null id')
        
        # Fix each one
        for product in products:
            new_id = str(uuid.uuid4())
            result = await db.products.update_one(
                {'_id': product['_id']},
                {'$set': {'id': new_id}}
            )
            print(f'Fixed product {product.get("product_id", "unknown")}: assigned id={new_id}')
        
        print(f'\nSuccessfully fixed {len(products)} products!')
    finally:
        client.close()

if __name__ == '__main__':
    asyncio.run(fix_null_ids())
