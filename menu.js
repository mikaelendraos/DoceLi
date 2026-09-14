// Menu de três pontos (celular): fecha ao escolher uma seção,
// ao tocar fora dele ou ao apertar Esc. Sem este arquivo o menu
// continua funcionando, só não fecha sozinho.
const menu = document.querySelector('.kebab');

if (menu) {
  menu.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) menu.open = false;
  });

  document.addEventListener('click', (evento) => {
    if (menu.open && !menu.contains(evento.target)) menu.open = false;
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
}
