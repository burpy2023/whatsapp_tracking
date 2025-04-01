# kforce_ws_server.py
import asyncio
import websockets
import requests
from bs4 import BeautifulSoup
import json

connected_clients = set()
seen_jobs = set()

async def check_kforce():
    global seen_jobs
    while True:
        try:
            url = 'https://www.kforce.com/find-work/search-jobs/?q=python'
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')

            job_cards = soup.find_all('a', class_='search-result')  # Adjust this class as needed
            new_jobs = []

            for card in job_cards:
                title = card.get_text(strip=True)
                link = 'https://www.kforce.com' + card['href']
                if link not in seen_jobs:
                    seen_jobs.add(link)
                    new_jobs.append({
                        "groupName": "Kforce Python Jobs",
                        "sender": "Kforce Bot",
                        "timestamp": asyncio.get_event_loop().time(),
                        "message": f"{title}\n{link}"
                    })

            for job in new_jobs:
                for ws in connected_clients:
                    await ws.send(json.dumps(job))

        except Exception as e:
            print("Error checking Kforce:", e)
            
        print("✅ Script started... waiting for WebSocket connections.")

        await asyncio.sleep(1800)  # Check every 30 minutes

async def handler(websocket, path):
    connected_clients.add(websocket)
    print("New client connected")

    try:
        async for message in websocket:
            pass  # (optional) handle incoming messages if needed
    finally:
        connected_clients.remove(websocket)
        print("Client disconnected")

async def main():
    async with websockets.serve(handler, "localhost", 8080):
        await check_kforce()  # this runs forever

asyncio.run(main())
