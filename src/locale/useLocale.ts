import { useRouter } from 'next/router';

const useLocale = (data: any) => {
  const { locale } = useRouter();

  return data?.[locale as keyof typeof data];
};

export default useLocale;
