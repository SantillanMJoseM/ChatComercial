import Link from 'next/link';

export function HelpLink({ articleId, label }: { articleId: string; label?: string }) {
  return (
    <Link href={`/help#${articleId}`} className="text-xs text-indigo-400 hover:underline ml-2">
      {label || '¿Qué es esto?'}
    </Link>
  );
}
