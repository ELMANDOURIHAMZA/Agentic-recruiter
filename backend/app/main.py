
from fastapi import FastAPI

app = FastAPI(
    title="Agentic AI Recruitment API",
    description="Intelligent recruitment platform powered by five specialized AI agents.",
    version="1.0.0",
)


@app.get("/", tags=["Health"])
async def root():
    return {
        "application": "Agentic AI Recruitment",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI",
    }
