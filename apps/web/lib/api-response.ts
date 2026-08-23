type APIErrorBody = {
  detail?: string;
  message?: string;
};

export async function readAPIResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: APIErrorBody & Partial<T> = {};

  if (text.trim()) {
    try {
      data = JSON.parse(text) as APIErrorBody & Partial<T>;
    } catch {
      throw new Error(
        response.ok
          ? 'پاسخ نامعتبر از سرویس دریافت شد.'
          : 'سرویس ورود پاسخ معتبری نداد. لطفاً چند لحظه دیگر دوباره تلاش کنید.'
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
        data.message ||
        (response.status === 405
          ? 'مسیر ورود پیامکی روی سرور فعال نیست.'
          : 'ارتباط با سرویس ورود برقرار نشد.')
    );
  }

  if (!text.trim()) {
    throw new Error('پاسخی از سرویس ورود دریافت نشد. لطفاً دوباره تلاش کنید.');
  }

  return data as T;
}
