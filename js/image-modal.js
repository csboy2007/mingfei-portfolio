/**
 * Image modal - click project images to view full size
 * Global: works on any page with .project-info section
 */
(function() {
	function init() {
		if (document.getElementById('img-modal-overlay')) return;
		var overlay = document.createElement('div');
		overlay.id = 'img-modal-overlay';
		overlay.innerHTML = '<div id="img-modal-content"><button id="img-modal-close" type="button" aria-label="Close">×</button><img src="" alt=""></div>';
		document.body.appendChild(overlay);

		var modalImg = overlay.querySelector('#img-modal-content img');
		var closeBtn = document.getElementById('img-modal-close');

		function openModal(src, alt) {
			modalImg.src = src;
			modalImg.alt = alt || '';
			overlay.classList.add('active');
			document.body.style.overflow = 'hidden';
		}
		function closeModal() {
			overlay.classList.remove('active');
			document.body.style.overflow = '';
		}

		document.addEventListener('click', function(e) {
			var img = e.target.closest('.project-info img');
			if (img) {
				e.preventDefault();
				openModal(img.src, img.alt);
			}
		});
		closeBtn.addEventListener('click', closeModal);
		overlay.addEventListener('click', function(e) {
			if (e.target === overlay) closeModal();
		});
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
		});
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
