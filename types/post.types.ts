export interface PostImage {
  image_url: string;
  display_order?: number;
}

export interface PostAuthor {
  _id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface Post {
  _id: string;
  user_id: PostAuthor | string;
  content: string;
  recipe_id?: any;
  status: 'visible' | 'hidden' | 'pending';
  images: PostImage[];
  created_at: string;
  likes_count?: number;
  comments_count?: number;
}

export interface CreatePostPayload {
  content: string;
  images?: Array<string | PostImage>;
  recipe_id?: string;
}
