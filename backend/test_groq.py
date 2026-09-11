import os, asyncio, dotenv
dotenv.load_dotenv()

from app.agents.specialists import extract_medications

async def test():
    try:
        res = await extract_medications(["Patient John took Lisinopril 10mg."])
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
