from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from sqlalchemy import inspect, text
from app.api import admin_problems, auth, problems, submissions, leaderboard
from app.models.problem import Problem
import logging

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Tables
Base.metadata.create_all(bind=engine)

def ensure_sqlite_schema_compatibility():
    if not engine.url.drivername.startswith("sqlite"):
        return

    columns_by_table = {
        table_name: {column["name"] for column in inspect(engine).get_columns(table_name)}
        for table_name in inspect(engine).get_table_names()
    }
    statements = []
    if "users" in columns_by_table and "is_admin" not in columns_by_table["users"]:
        statements.append("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0")
    if "problems" in columns_by_table:
        problem_columns = columns_by_table["problems"]
        if "difficulty" not in problem_columns:
            statements.append("ALTER TABLE problems ADD COLUMN difficulty VARCHAR")
        if "why_false" not in problem_columns:
            statements.append("ALTER TABLE problems ADD COLUMN why_false TEXT")
        if "known_minimal_counterexample" not in problem_columns:
            statements.append("ALTER TABLE problems ADD COLUMN known_minimal_counterexample JSON")
        if "draft_predicate" not in problem_columns:
            statements.append("ALTER TABLE problems ADD COLUMN draft_predicate TEXT")

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))

ensure_sqlite_schema_compatibility()

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
                    status="active",
                    difficulty="medium"
                ),
                Problem(
                    title="Planar 3-Coloring",
                    statement_text="Every planar graph is 3-colorable.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="planar_3color",
                    status="active",
                    difficulty="hard"
                ),
                Problem(
                    title="Degree-2 Hamiltonian Cycle",
                    statement_text="Every connected graph with minimum degree >= 2 contains a Hamiltonian cycle.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="min_degree_hamiltonian",
                    status="active",
                    difficulty="hard"
                ),
                Problem(
                    title="Tree Leaves",
                    statement_text="Every tree has exactly two leaves.",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="tree_leaves",
                    status="active",
                    difficulty="beginner"
                ),
                Problem(
                    title="Path vs Cycle Hamiltonian",
                    statement_text="Every graph with a Hamiltonian path is Hamiltonian (has a Hamiltonian cycle).",
                    object_type="graph",
                    size_metric="vertices",
                    verification_predicate_ref="ham_path_to_cycle",
                    status="active",
                    difficulty="medium"
                )
            ]
            db.bulk_save_objects(seeds)
            db.commit()
            logger.info("Database seeded successfully.")
        else:
            # Backfill difficulty on existing seeded problems that have null difficulty
            difficulty_map = {
                "Chromatic K4 Conjecture": "medium",
                "Planar 3-Coloring": "hard",
                "Degree-2 Hamiltonian Cycle": "hard",
                "Tree Leaves": "beginner",
                "Path vs Cycle Hamiltonian": "medium",
            }
            updated = False
            for title, diff in difficulty_map.items():
                prob = db.query(Problem).filter(Problem.title == title, Problem.difficulty == None).first()
                if prob:
                    prob.difficulty = diff
                    updated = True
            if updated:
                db.commit()
                logger.info("Backfilled difficulty on existing seed problems.")

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
app.include_router(admin_problems.router, prefix="/admin", tags=["Admin Problems"])
app.include_router(problems.router, prefix="/api/problems", tags=["Problems"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
