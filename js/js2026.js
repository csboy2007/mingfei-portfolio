/* ══════════════════════════════════════════════
 * js2026.js
 * - Hover interaction for Organic AI Orb
 * - Scroll shrink orb → dot
 * - Scroll-driven SVG curve (fixed path, drawn on scroll)
 * ══════════════════════════════════════════════ */

const CONFIG = {
	hoverSpeedMultiplier: 5
};

// ── Hover: speed up animation on mouse enter ──
function setupHoverInteraction() {
	const blob = document.querySelector('.blob');
	if (!blob) return;

	const animations = blob.getAnimations();

	blob.addEventListener('mouseenter', () => {
		animations.forEach(anim => {
			anim.playbackRate = CONFIG.hoverSpeedMultiplier;
		});
	});

	blob.addEventListener('mouseleave', () => {
		animations.forEach(anim => {
			anim.playbackRate = 1;
		});
	});
}

// ── Scroll: shrink orb continuously from full size to 6px dot ──
function setupScrollShrink() {
	const heroSection = document.getElementById('fh5co-home');
	const blobWrapper = document.querySelector('.blob-wrapper');
	if (!heroSection || !blobWrapper) return;

	const blobSize = 200;
	const minSize = 6;
	const minScale = minSize / blobSize;

	function onScroll() {
		// EXPERIMENT: disable shrink, keep orb full size
		/*
		const rect = heroSection.getBoundingClientRect();
		const heroHeight = heroSection.offsetHeight;
		const scrollProgress = Math.max(0, Math.min(1, -rect.top / (heroHeight * 0.65)));
		const scale = Math.max(minScale, 1 - scrollProgress * (1 - minScale));

		blobWrapper.style.transform = `scale(${scale})`;

		if (scale < 0.08) {
			blobWrapper.style.opacity = 0;
		} else {
			blobWrapper.style.opacity = 1;
		}

		const blob = blobWrapper.querySelector('.blob');
		if (blob) {
			if (scrollProgress > 0.05) {
				blob.style.animationPlayState = 'paused';
			} else {
				blob.style.animationPlayState = 'running';
			}
		}
		*/
	}

	let scheduled = false;
	window.addEventListener('scroll', () => {
		if (!scheduled) {
			scheduled = true;
			requestAnimationFrame(() => {
				onScroll();
				scheduled = false;
			});
		}
	});

	onScroll();
}

// ── Scroll-driven SVG curve ──
function setupScrollCurve() {
	const svg = document.getElementById('scroll-curve');
	const path = document.getElementById('scroll-path');
	const blob = document.querySelector('.blob');
	const blobWrapper = document.querySelector('.blob-wrapper');
	const heroSection = document.getElementById('fh5co-home');
	if (!path || !svg || !blob || !heroSection || !blobWrapper) return;

	const pageWidth = document.documentElement.clientWidth;
	const pageHeight = document.documentElement.scrollHeight;
	svg.setAttribute('viewBox', `0 0 ${pageWidth} ${pageHeight}`);
	svg.style.height = pageHeight + 'px';

	// Calculate blob's bottom-center at rest (before any scroll)
	// blob is inside blobWrapper which has transform-origin: center bottom
	// The blob-wrapper is inside #hero-orb which is flex-centered
	const orbContainer = document.getElementById('hero-orb');
	const orbRect = orbContainer.getBoundingClientRect();
	const scrollY = window.scrollY || 0;
	// Blob center = orb container center (convert viewport coords to document coords)
	const blobCenterX = orbRect.left + orbRect.width / 2;
	// Blob bottom = orb vertical center + half blob height (blob is 200px, visually centered)
	// Convert viewport Y to document Y by adding scroll offset
	const blobBottomY = orbRect.top + scrollY + orbRect.height / 2 + 88; // 100 = half of 200px blob

	const startX = blobCenterX;
	const startY = blobBottomY; // document coords

	// Waypoints for S-curve below hero, ending near footer
	const footer = document.getElementById('fh5co-footer');
	const clarityDot = document.getElementById('clarity-dot');
	const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
	const endY = footer ? (footer.offsetTop + footer.offsetHeight + 40) : (pageHeight - 100);
	const totalDist = endY - startY;
	const segments = 6;
	const segHeight = totalDist / segments;

	// Build the path ONCE — last segment ends at clarity circle's top center
	const clarityCircle = document.querySelector('.clarity-circle');
	let finalX = pageWidth * 0.35;
	let finalY = endY;
	if (clarityCircle) {
		const cdRect = clarityCircle.getBoundingClientRect();
		const scrollY2 = window.scrollY || 0;
		finalX = cdRect.left + cdRect.width / 2;
		finalY = cdRect.top + scrollY2; // top of circle
	}

	let d = `M ${startX} ${startY}`;
	let prevX = startX;
	let prevY = startY;

	for (let i = 0; i < segments - 1; i++) {
		const y = startY + (i + 1) * segHeight;
		// On smaller screens, push the curve wider so it isn't hidden behind cards
		let leftX, rightX;
		if (pageWidth < 768) {
			leftX = pageWidth * 0.03;
			rightX = pageWidth * 0.97;
		} else if (pageWidth < 1024) {
			leftX = pageWidth * 0.05;
			rightX = pageWidth * 0.92;
		} else {
			// Cap curve width to max 1200px centered on page
			const maxCurveWidth = 1200;
			const curveWidth = Math.min(pageWidth * 0.84, maxCurveWidth);
			const curveLeft = (pageWidth - curveWidth) / 2;
			leftX = curveLeft;
			rightX = curveLeft + curveWidth;
		}
		const x = (i % 2 === 0) ? leftX : rightX;
		const midY = (prevY + y) / 2;
		d += ` C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
		prevX = x;
		prevY = y;
	}

	// Final segment: curve straight down into clarity dot top center
	const midYFinal = (prevY + finalY) / 2;
	d += ` C ${prevX} ${midYFinal}, ${finalX} ${midYFinal}, ${finalX} ${finalY}`;

	path.setAttribute('d', d);
	const pathLength = path.getTotalLength();
	path.style.strokeDasharray = pathLength;
	path.style.strokeDashoffset = pathLength;

	// Curve color: fixed to blob's initial color (green)
	const heroHeight = heroSection.offsetHeight;
	let currentProgress = 0; // smoothed draw progress
	// Cache DOM queries and last written values to avoid unnecessary repaints
	const displaceMap = document.getElementById('curve-displace-map');
	const glassBoxSection = document.getElementById('glass-box-pattern');
	const grainOverlay = blob.querySelector('.grain-overlay');
	let lastDashOffset = -1;
	let lastNoiseScale = -1;
	let lastStrokeWidth = -1;
	let lastBlobPaused = null;

	function onScroll() {
		const heroRect = heroSection.getBoundingClientRect();
		const orbProgress = Math.max(0, Math.min(1, -heroRect.top / (heroHeight * 0.5)));

		// Curve starts when orb is 50% shrunk
		const curveStart = 0.5;
		const curveTriggered = orbProgress >= curveStart;

		// Line tip stays at 60% of viewport height
		const scrollTop = window.scrollY || 0;
		const viewportH = window.innerHeight;
		const tipDocY = scrollTop + viewportH * 0.6;

		const pathStartY = startY;
		const pathEndY = finalY;
		const pathProgress = Math.max(0, Math.min(1, (tipDocY - pathStartY) / (pathEndY - pathStartY)));

		// Once footer top enters viewport, draw to 100%
		const footerRect = footer ? footer.getBoundingClientRect() : null;
		const footerVisible = footerRect && footerRect.top < viewportH;

		let targetProgress;
		if (footerVisible) {
			targetProgress = 1;
		} else if (!curveTriggered) {
			targetProgress = 0;
		} else {
			targetProgress = pathProgress;
		}

		// Smooth easing: drawing speed vs erasing speed
		const lerpSpeed = targetProgress > currentProgress ? 0.2 : 0.6;
		currentProgress += (targetProgress - currentProgress) * lerpSpeed;

		// Only write to DOM if value changed meaningfully
		const newDashOffset = Math.round(pathLength * (1 - currentProgress));
		if (newDashOffset !== lastDashOffset) {
			path.style.strokeDashoffset = newDashOffset;
			lastDashOffset = newDashOffset;
		}

		// Reduce noise: only update when glassBox section is relevant
		if (displaceMap && glassBoxSection) {
			const gbRect = glassBoxSection.getBoundingClientRect();
			const gbBottom = gbRect.bottom;
			const noiseProgress = Math.max(0, Math.min(1, 1 - (gbBottom / viewportH)));
			const noiseScale = Math.round(Math.max(0, 50 * (1 - noiseProgress)));
			if (noiseScale !== lastNoiseScale) {
				displaceMap.setAttribute('scale', noiseScale);
				lastNoiseScale = noiseScale;
			}
			const strokeWidth = Math.round(16 - (14 * noiseProgress));
			if (strokeWidth !== lastStrokeWidth) {
				path.setAttribute('stroke-width', strokeWidth);
				lastStrokeWidth = strokeWidth;
			}
		}

		// Show clarity dot when back-to-top card enters viewport
		if (clarityDot) {
			const clarityRect = clarityDot.getBoundingClientRect();
			if (clarityRect.top <= viewportH * 0.8) {
				clarityDot.classList.add('visible');
			} else {
				clarityDot.classList.remove('visible');
			}
		}

		// Freeze/restore blob animations only on state change
		const shouldPause = currentProgress > 0.01;
		if (shouldPause !== lastBlobPaused) {
			const state = shouldPause ? 'paused' : 'running';
			blob.style.animationPlayState = state;
			if (grainOverlay) grainOverlay.style.animationPlayState = state;
			lastBlobPaused = shouldPause;
		}
	}

	// rAF loop — runs every frame so lerp easing continues between scroll events
	function loop() {
		onScroll();
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
}

// ── Shared shape colors (set once, reused by hero and clarity) ──
let sharedShapeColors = { triangle: null, square: null };

// ── Align clarity shapes: square's left edge aligns with email text's left edge ──
// Also assign colors to triangle and square matching the hero shapes
function alignClarityShapes() {
	const shapesEl = document.querySelector('.clarity-shapes');
	const squareEl = document.querySelector('.clarity-square');
	const dotEl = document.getElementById('clarity-dot');
	if (!shapesEl || !dotEl || !squareEl) return;

	// Shapes now live inside a card image area — let them fill available width
	shapesEl.style.width = '100%';

	// Use the same colors as hero shapes
	const triangle = document.querySelector('.clarity-triangle');
	if (triangle && sharedShapeColors.triangle) {
		triangle.style.color = sharedShapeColors.triangle;
	}
	if (squareEl && sharedShapeColors.square) {
		squareEl.style.backgroundColor = sharedShapeColors.square;
	}

	// Arrows get remaining colors from the palette
	const otherColors = [
		'hsla(220, 100%, 72%, 1)',      // blue
		'#E8D1FF',                      // light purple
		'hsla(182, 72%, 68%, 1)',       // cyan
		'#FFD78A'                       // warm gold
	];
	// Filter out the colors already used by triangle and square
	const remaining = otherColors.filter(c => c !== sharedShapeColors.triangle && c !== sharedShapeColors.square);
	const arrows = document.querySelectorAll('.clarity-arrow');
	if (arrows[0] && remaining[0]) {
		arrows[0].querySelectorAll('line, polygon, rect').forEach(el => {
			el.setAttribute('fill', remaining[0]);
			el.setAttribute('stroke', remaining[0]);
		});
	}
	if (arrows[1] && remaining[1]) {
		arrows[1].querySelectorAll('line, polygon, rect').forEach(el => {
			el.setAttribute('fill', remaining[1]);
			el.setAttribute('stroke', remaining[1]);
		});
	}
}

// ── Assign random colors to hero section shape decorations ──
function assignHeroShapeColors() {
	const otherColors = [
		'hsla(220, 100%, 72%, 1)',      // blue
		'#E8D1FF',                      // light purple
		'hsla(182, 72%, 68%, 1)',       // cyan
		'#FFD78A'                       // warm gold
	];

	// Shuffle colors once
	const shuffled = otherColors.sort(() => Math.random() - 0.5);

	// Store for clarity shapes to reuse
	sharedShapeColors.triangle = shuffled[0];
	sharedShapeColors.square = shuffled[1];

	// Assign triangle color to ALL .shape-triangle elements
	document.querySelectorAll('.shape-triangle').forEach(el => {
		el.style.color = shuffled[0];
	});

	// Assign square color to ALL .shape-square elements
	document.querySelectorAll('.shape-square').forEach(el => {
		el.style.backgroundColor = shuffled[1];
	});
}

// ── Init ──
requestAnimationFrame(setupHoverInteraction);
document.addEventListener('DOMContentLoaded', () => {
	setupScrollShrink();
	setupScrollCurve();
	assignHeroShapeColors();

	// Align shapes after fonts/layout fully rendered
	window.addEventListener('load', () => {
		alignClarityShapes();
	});

	// Rebuild curve on resize (orb position changes)
	window.addEventListener('resize', () => {
		setupScrollCurve();
		alignClarityShapes();
	});
});
