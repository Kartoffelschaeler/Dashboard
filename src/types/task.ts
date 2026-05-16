export type Task = {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
};

export type CreateTaskInput = {
  text: string;
};
