/**
 * Ícones das "Categorias de Projetos" (/projetos).
 *
 * O painel guarda no banco só a CHAVE do ícone (project_categories.icon) e o
 * desenho fica aqui — assim a página nunca renderiza SVG vindo do banco, e
 * trocar/ajustar um ícone é mudança de código, não de conteúdo.
 *
 * O `svg` é o miolo de um <svg viewBox="0 0 26 26">: o traço principal usa
 * currentColor (a cor vem do container) e #6F8F3A é o verde de apoio.
 */
export interface ProjectCategoryIcon {
  /** Nome mostrado no seletor do painel. */
  label: string
  svg: string
}

export const PROJECT_CATEGORY_ICONS: Record<string, ProjectCategoryIcon> = {
  agropecuario: {
    label: 'Agropecuário',
    svg: '<path d="M3 20C3 20 7 13 13 11C19 13 23 20 23 20" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"></path><path d="M13 20V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path><circle cx="13" cy="5" r="1.8" fill="#6F8F3A"></circle>',
  },
  ambiental: {
    label: 'Ambiental',
    svg: '<path d="M6 24C6 19.029 10.029 15 15 15C15 10.029 19.029 6 24 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"></path><path d="M2 20C2 11.163 9.163 4 18 4" stroke="#6F8F3A" stroke-width="1" stroke-linecap="round" opacity="0.5"></path>',
  },
  social: {
    label: 'Social',
    svg: '<circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.3" fill="none"></circle><circle cx="17" cy="8" r="3.5" stroke="#6F8F3A" stroke-width="1" fill="none"></circle><path d="M3 21C3 17.686 5.686 15 9 15H13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path><path d="M19 15C21.209 15 23 16.791 23 19V21" stroke="#6F8F3A" stroke-width="1" stroke-linecap="round"></path>',
  },
  cultural: {
    label: 'Cultural',
    svg: '<path d="M13 3L4 12H22L13 3Z" stroke="currentColor" stroke-width="1.3" fill="none"></path><rect x="7" y="12" width="12" height="11" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"></rect>',
  },
  esportivo: {
    label: 'Esportivo',
    svg: '<path d="M13 3L15 9H21L16 13L18 19L13 15L8 19L10 13L5 9H11L13 3Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"></path>',
  },
  mulheres: {
    label: 'Mulheres',
    svg: '<circle cx="13" cy="10" r="4" stroke="currentColor" stroke-width="1.3" fill="none"></circle><path d="M13 14V22M9 21H17" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>',
  },
  familiar: {
    label: 'Agricultura familiar',
    svg: '<rect x="4" y="13" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"></rect><rect x="11" y="8" width="4" height="14" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"></rect><rect x="18" y="4" width="4" height="18" rx="1" stroke="currentColor" stroke-width="1.3" fill="none"></rect>',
  },
  capacitacao: {
    label: 'Capacitação',
    svg: '<path d="M5 23V10C5 9.448 5.448 9 6 9H20C20.552 9 21 9.448 21 10V23" stroke="currentColor" stroke-width="1.3" fill="none"></path><path d="M13 9V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path><circle cx="13" cy="3.5" r="1.5" fill="#6F8F3A"></circle><path d="M3 23H23" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"></path>',
  },
  bioeconomia: {
    label: 'Bioeconomia',
    svg: '<circle cx="13" cy="13" r="8" stroke="currentColor" stroke-width="1.3" fill="none"></circle><path d="M9 13C9 10.791 10.791 9 13 9C15.209 9 17 10.791 17 13" stroke="#6F8F3A" stroke-width="1" fill="none" stroke-linecap="round"></path><circle cx="13" cy="13" r="2" fill="currentColor" opacity="0.4"></circle>',
  },
  sustentavel: {
    label: 'Desenvolvimento sustentável',
    svg: '<path d="M13 3L3 9V23H9V15H17V23H23V9L13 3Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"></path>',
  },
  projeto: {
    label: 'Projeto (genérico)',
    svg: '<rect x="4" y="3" width="18" height="20" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"></rect><path d="M8 9H18M8 13H18M8 17H14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>',
  },
  agua: {
    label: 'Água',
    svg: '<path d="M13 3C13 3 6 11 6 16C6 19.866 9.134 23 13 23C16.866 23 20 19.866 20 16C20 11 13 3 13 3Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"></path><path d="M10 16C10 18.209 11.343 19.5 13 19.5" stroke="#6F8F3A" stroke-width="1" stroke-linecap="round"></path>',
  },
  tecnologia: {
    label: 'Tecnologia',
    svg: '<rect x="5" y="5" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.3" fill="none"></rect><rect x="10" y="10" width="6" height="6" rx="1" stroke="#6F8F3A" stroke-width="1" fill="none"></rect><path d="M10 2V5M16 2V5M10 21V24M16 21V24M2 10H5M2 16H5M21 10H24M21 16H24" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path>',
  },
  saude: {
    label: 'Saúde',
    svg: '<path d="M13 22C13 22 4 16.5 4 10.5C4 7.462 6.462 5 9.5 5C11.04 5 12.4 5.63 13 6.8C13.6 5.63 14.96 5 16.5 5C19.538 5 22 7.462 22 10.5C22 16.5 13 22 13 22Z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"></path>',
  },
}

export const DEFAULT_PROJECT_CATEGORY_ICON = 'projeto'

export function projectCategoryIconSvg(key: string): string {
  const icon = PROJECT_CATEGORY_ICONS[key] || PROJECT_CATEGORY_ICONS[DEFAULT_PROJECT_CATEGORY_ICON]
  return icon.svg
}
