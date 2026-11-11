export function resolveTools(version: any) {
  return (version?.toolPermissions || []).filter((tp: any) => tp.allowed).map((tp: any) => tp.tool);
}
