from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category, Todo
from ..schemas import CategoryTreeOut
from ..security import require_session

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(require_session)])


@router.get("", response_model=list[CategoryTreeOut])
def get_dashboard_tree(db: Session = Depends(get_db)):
    """Full recursive 분류 tree (unbounded depth) plus per-todo rollup, in two
    flat queries instead of a per-level request waterfall or a recursive CTE.
    """
    categories = db.scalars(
        select(Category).where(Category.deleted_at.is_(None)).order_by(Category.sort_order)
    ).all()
    todos = db.scalars(
        select(Todo).where(Todo.deleted_at.is_(None)).order_by(Todo.sort_order)
    ).all()

    todos_by_category = defaultdict(list)
    for todo in todos:
        todos_by_category[todo.category_id].append(todo)

    children_by_parent = defaultdict(list)
    for category in categories:
        children_by_parent[category.parent_id].append(category)

    def build(category: Category) -> CategoryTreeOut:
        child_nodes = [build(child) for child in children_by_parent.get(category.id, [])]
        own_todos = todos_by_category.get(category.id, [])
        todo_count = len(own_todos) + sum(node.todo_count for node in child_nodes)
        done_count = sum(1 for t in own_todos if t.status == "done") + sum(
            node.done_count for node in child_nodes
        )
        return CategoryTreeOut(
            id=category.id,
            parent_id=category.parent_id,
            name=category.name,
            icon=category.icon,
            color=category.color,
            icloud_list_uid=category.icloud_list_uid,
            icloud_list_name=category.icloud_list_name,
            sort_order=category.sort_order,
            created_at=category.created_at,
            updated_at=category.updated_at,
            children=child_nodes,
            todos=own_todos,
            todo_count=todo_count,
            done_count=done_count,
        )

    return [build(category) for category in children_by_parent.get(None, [])]
