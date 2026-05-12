const BASE_URL = import.meta.env.VITE_API_URL ?? '';

export interface Post {
    id: number;
    category: string;
    title: string;
    content: string;
    writer: string;
    role: string;
    created_at: string;
    comments: number;
}

export interface Comment {
    id: number;
    writer: string;
    role: string;
    parent_id: number | null;
    content: string;
    created_at: string;
    isMyComment: boolean;
    replies?: Comment[]
}


export interface PostDetail {
    id: number;
    category: string;
    title: string;
    content: string;
    writer: string;
    role: string;
    created_at: string;
    photos: string[];
    comment_count: number;
    comments: Comment[];
}

// 게시글 목록 조회
export async function fetchBoardList(storeId: number): Promise<Post[]> {
    try {
        const res = await fetch(`${BASE_URL}/api/common/board`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "store_id": storeId })
        });

        if (!res.ok) {
            throw new Error('게시판 데이터를 불러오는데 실패했습니다.');
        }

        const data = await res.json();
        return data;

    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// 게시글 상세 조회 
export async function fetchBoardInfo(boardId: number) {
    try {
        const res = await fetch(`${BASE_URL}/api/common/board/${boardId}`);

        if (!res.ok) {
            throw new Error('게시글 데이터를 불러오는데 실패했습니다.');
        }

        const data = await res.json();
        return data;

    } catch (err) {
        console.error("API 호출 에러:", err);
        throw err;
    }
}

// 게시글 추가
export async function addBoard(store_id: number, category: string, title: string, content: string, image: string[]) {
    const formData = new FormData();
    formData.append("store_id", String(store_id));
    formData.append("category", category);
    formData.append("title", title);
    formData.append("content", content);

    for (const base64 of image) {
        const blob = await fetch(base64).then(r => r.blob());
        formData.append("images", blob, "image.jpg");
    }

    const response = await fetch(`${BASE_URL}/api/common/board/add`, {
        method: "POST",
        body: formData,
        credentials: 'include',
    });
    if (!response.ok) throw new Error("게시글 등록 실패");
    return response.json();
}

// 게시글 수정 
export async function modifyBoard(
    board_id: number,
    category: string,
    title: string,
    content: string,
    photos: string[]
) {
    const formData = new FormData();
    formData.append("board_id", String(board_id));
    formData.append("category", category);
    formData.append("title", title);
    formData.append("content", content);

    // 기존 URL과 새 base64 구분
    const existingUrls = photos.filter(p => p.startsWith('/uploads'));
    const newPhotos = photos.filter(p => p.startsWith('data:'));

    formData.append("existing_images", JSON.stringify(existingUrls));
    formData.append("clear_images", photos.length === 0 ? "true" : "false");

    for (const base64 of newPhotos) {
        const blob = await fetch(base64).then(r => r.blob());
        formData.append("images", blob, "image.jpg");
    }

    const response = await fetch(`${BASE_URL}/api/common/board/modify`, {
        method: "POST",
        body: formData,
        credentials: 'include',
    });
    if (!response.ok) throw new Error("게시글 수정 실패");
    return response.json();
}

// 게시글 삭제
export async function deleteBoard(boardId: number) {
    const response = await fetch(`${BASE_URL}/api/common/board/${boardId}`, {
        method: "DELETE",
        credentials: 'include',
    });
    if (!response.ok) throw new Error("게시글 삭제 실패");
    return response.json();
}

// 댓글 추가
export async function addComment(boardId: number, content: string, parentId: number | null = null) {
    const response = await fetch(`${BASE_URL}/api/common/board/${boardId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parent_id: parentId }),
        credentials: 'include',
    });
    if (!response.ok) throw new Error("댓글 등록 실패");
    return response.json();
}

// 댓글 삭제
export async function deleteComment(commentId: number) {
    const response = await fetch(`${BASE_URL}/api/common/board/comment/${commentId}`, {
        method: "DELETE",
        credentials: 'include',
    });
    if (!response.ok) throw new Error("댓글 삭제 실패");
    return response.json();
}