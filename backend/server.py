from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEXT_URL = "http://localhost:3000"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy(request: Request, path: str):
    async with httpx.AsyncClient() as client:
        # The path comes with /api prefix from ingress, so just use it directly
        # path will be like "api/posts" so we need to forward to /api/posts
        if path.startswith("api/"):
            url = f"{NEXT_URL}/{path}"
        else:
            url = f"{NEXT_URL}/api/{path}"
        print(f"Proxying to: {url}")
        
        headers = dict(request.headers)
        headers.pop("host", None)
        
        body = await request.body()
        
        response = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
            params=request.query_params,
            timeout=30.0
        )
        
        return StreamingResponse(
            iter([response.content]),
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.headers.get("content-type")
        )
