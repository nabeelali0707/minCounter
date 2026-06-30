from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.api import auth, problems, submissions, leaderboard
from app.models.problem import Problem
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Tables
Base.metadata.create_all(bind=engine)

# Seed Database
def seed_problems():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Problem).count() == 0:
            logger.info("Seeding database with default graph problems...")
            seeds = [
                Problem(
                    title="Chromatic K4 Conjecture",
                    statement_text="Every graph with chromatic number >= 4 contains K4 as a subgraph.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="chromatic_k4",
                    status="active"
                ),
                Problem(
                    title="Planar 3-Coloring",
                    statement_text="Every planar graph is 3-colorable.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="planar_3color",
                    status="active"
                ),
                Problem(
                    title="Degree-2 Hamiltonian Cycle",
                    statement_text="Every connected graph with minimum degree >= 2 contains a Hamiltonian cycle.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="degree2_hamiltonian",
                    status="active"
                ),
                Problem(
                    title="Tree Leaves",
                    statement_text="Every tree has exactly two leaves.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="tree_leaves",
                    status="active"
                ),
                Problem(
                    title="Path vs Cycle Hamiltonian",
                    statement_text="Every graph with a Hamiltonian path is Hamiltonian (has a Hamiltonian cycle).",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="path_hamiltonian",
                    status="active"
                )
            ]
            db.bulk_save_objects(seeds)
            db.commit()
            logger.info("Database seeded successfully.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

seed_problems()

app = FastAPI(
    title="Minimal Counterexample Leaderboard API",
    version="1.0",
    description="Backend API and Verification Engine for the Minimal Counterexample Leaderboard"
)

# CORS Middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(problems.router, prefix="/api/problems", tags=["Problems"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
