import os
import sys
from logging.config import fileConfig
from urllib.parse import unquote

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

# Insert the parent directory of this env.py to sys.path so app can be imported
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base
from app.models import User, Problem, Submission, LeaderboardEntry
from app.config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Use DIRECT_URL for migrations if available (session-mode pooler, no PgBouncer)
# Falls back to DATABASE_URL (works with SQLite for local dev)
migration_url = settings.DIRECT_URL if settings.DIRECT_URL else settings.DATABASE_URL
# Strip pgbouncer param if still present (safety net)
migration_url = migration_url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
# Decode any URL-encoded characters (e.g. %3F -> ?) in the password
migration_url = unquote(migration_url)
# configparser uses % for interpolation; escape all literal % signs as %%
config.set_main_option("sqlalchemy.url", migration_url.replace("%", "%%"))

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using DIRECT_URL (session-mode pooler)."""
    connectable = create_engine(
        migration_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
