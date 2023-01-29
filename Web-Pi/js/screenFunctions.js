function afficherScreenSize(id) {
	el = document.getElementById(id);
	if (el) {
		el.innerHTML = window.innerWidth+'X'+window.innerHeight;
	}
}
// Click bascule en mode plein écran
function switchScreenMode(event) {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
};