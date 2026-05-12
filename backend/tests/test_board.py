"""4단계 — 게시판: CRUD + 가게 격리"""
import pytest
from conftest import BASE, STORE_1, STORE_2

BOARD_LIST = f"{BASE}/api/common/board"
BOARD_ADD  = f"{BASE}/api/common/board/add"
BOARD_MOD  = f"{BASE}/api/common/board/modify"


def _add_post(session, store_id=STORE_1, title="테스트 제목", content="테스트 내용"):
    # board/add는 multipart Form 형식
    return session.post(BOARD_ADD, data={
        "store_id": store_id,
        "category": "일반 게시글",
        "title": title,
        "content": content,
    })


def _get_list(session, store_id=STORE_1):
    return session.post(BOARD_LIST, json={"store_id": store_id})


@pytest.fixture
def post_id(emp):
    """테스트용 게시글 생성 후 id 반환, 테스트 후 삭제"""
    r = _add_post(emp)
    assert r.status_code == 200
    post_id = r.json().get("id")
    yield post_id
    emp.delete(f"{BASE}/api/common/board/{post_id}")


def test_create_post(emp):
    r = _add_post(emp)
    assert r.status_code == 200
    data = r.json()
    assert "id" in data
    # 정리
    emp.delete(f"{BASE}/api/common/board/{data['id']}")


def test_board_list_returns_posts(emp):
    r = _get_list(emp)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_board_detail(emp, post_id):
    r = emp.get(f"{BASE}/api/common/board/{post_id}")
    assert r.status_code == 200
    data = r.json()
    assert data.get("title") == "테스트 제목"


def test_modify_post(emp, post_id):
    r = emp.post(BOARD_MOD, data={
        "board_id": post_id,
        "category": "건의사항",
        "title": "수정된 제목",
        "content": "수정된 내용",
    })
    assert r.status_code == 200
    detail = emp.get(f"{BASE}/api/common/board/{post_id}").json()
    assert detail.get("title") == "수정된 제목"


def test_delete_post(emp):
    r = _add_post(emp, title="삭제용")
    pid = r.json().get("id")
    del_r = emp.delete(f"{BASE}/api/common/board/{pid}")
    assert del_r.status_code == 200
    detail = emp.get(f"{BASE}/api/common/board/{pid}")
    assert detail.status_code == 404


def test_store_isolation(emp):
    """노량물산 글이 노량전자 목록에 보이면 안 됨"""
    r = _add_post(emp, store_id=STORE_1, title="노량물산 전용글")
    pid = r.json().get("id")

    store2_list = _get_list(emp, store_id=STORE_2).json()
    ids = [p["id"] for p in store2_list]
    assert pid not in ids, "다른 가게 게시글이 노출되면 안 됨"

    emp.delete(f"{BASE}/api/common/board/{pid}")


def test_add_comment(emp, post_id):
    r = emp.post(f"{BASE}/api/common/board/{post_id}/comment", json={"content": "댓글 내용"})
    assert r.status_code == 200


def test_delete_comment(emp, post_id):
    r = emp.post(f"{BASE}/api/common/board/{post_id}/comment", json={"content": "삭제할 댓글"})
    cid = r.json().get("id")
    del_r = emp.delete(f"{BASE}/api/common/board/comment/{cid}")
    assert del_r.status_code == 200
