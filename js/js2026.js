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

	const blobSize = 300;
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
	// Blob bottom = orb vertical center + half blob height (blob is 300px, visually centered)
	// Convert viewport Y to document Y by adding scroll offset
	const blobBottomY = orbRect.top + scrollY + orbRect.height / 2 + 150; // 150 = half of 300px blob

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
		const x = (i % 2 === 0) ? pageWidth * 0.25 : pageWidth * 0.7;
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

	function onScroll() {
		const heroRect = heroSection.getBoundingClientRect();
		const orbProgress = Math.max(0, Math.min(1, -heroRect.top / (heroHeight * 0.65)));

		// Curve starts when orb is 80% shrunk — but only triggers, doesn't drive speed
		const curveStart = 0.8;
		const curveTriggered = orbProgress >= curveStart;

		// Line tip stays at 60% of viewport height
		// Map: viewport 60% Y position → how far along the path that point is
		const scrollTop = window.scrollY || 0;
		const viewportH = window.innerHeight;
		const tipDocY = scrollTop + viewportH * 0.6; // where line tip should be in document coords

		// Path runs from startY to finalY — map tipDocY into that range
		const pathStartY = startY;
		const pathEndY = finalY;
		const pathProgress = Math.max(0, Math.min(1, (tipDocY - pathStartY) / (pathEndY - pathStartY)));

		// Once footer top enters viewport, draw to 100%
		const footerRect = footer ? footer.getBoundingClientRect() : null;
		const footerVisible = footerRect && footerRect.top < viewportH;

		let drawProgress;
		if (footerVisible) {
			drawProgress = 1;
		} else if (!curveTriggered) {
			drawProgress = 0;
		} else {
			drawProgress = pathProgress;
		}

		path.style.strokeDashoffset = pathLength * (1 - drawProgress);

		// Reduce noise: fully clean after glass-box-pattern section scrolls off screen
		const displaceMap = document.getElementById('curve-displace-map');
		const glassBoxSection = document.getElementById('glass-box-pattern');
		if (displaceMap && glassBoxSection) {
			const gbRect = glassBoxSection.getBoundingClientRect();
			// When bottom of glass-box-pattern goes above viewport → noise = 0
			const gbBottom = gbRect.bottom;
			const viewportH = window.innerHeight;
			// noiseProgress: 0 when section fully visible, 1 when its bottom passes top of viewport
			const noiseProgress = Math.max(0, Math.min(1, 1 - (gbBottom / viewportH)));
			const noiseScale = Math.max(0, 50 * (1 - noiseProgress));
			displaceMap.setAttribute('scale', noiseScale);

			// Shrink stroke width from 16 to 2 along with noise
			const strokeWidth = 16 - (14 * noiseProgress); // 16 → 2
			path.setAttribute('stroke-width', strokeWidth);
		}

		// Show clarity dot when footer's 30% enters viewport
		if (clarityDot) {
			if (footerRect) {
				const footerHeight = footerRect.height;
				// Calculate when 30% of footer has entered the viewport
				// footerRect.top is distance from top of viewport to footer's top
				// When footerRect.top <= viewportH - (footerHeight * 0.3), footer's 30% is in view
				const footerTrigger = viewportH - (footerHeight * 0.3);
				if (footerRect.top <= footerTrigger) {
					clarityDot.classList.add('visible');
				} else {
					clarityDot.classList.remove('visible');
				}
			} else {
				clarityDot.classList.remove('visible');
			}
		}

		// Freeze blob animations once curve appears
		const grainOverlay = blob.querySelector('.grain-overlay');
		if (drawProgress > 0) {
			blob.style.animationPlayState = 'paused';
			if (grainOverlay) grainOverlay.style.animationPlayState = 'paused';
		} else {
			blob.style.animationPlayState = 'running';
			if (grainOverlay) grainOverlay.style.animationPlayState = 'running';
		}
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

// ── Shared shape colors (set once, reused by hero and clarity) ──
let sharedShapeColors = { triangle: null, square: null };

// ── Align clarity shapes: square's left edge aligns with email text's left edge ──
// Also assign colors to triangle and square matching the hero shapes
function alignClarityShapes() {
	const emailEl = document.getElementById('footer-email');
	const shapesEl = document.querySelector('.clarity-shapes');
	const squareEl = document.querySelector('.clarity-square');
	const dotEl = document.getElementById('clarity-dot');
	if (!emailEl || !shapesEl || !dotEl || !squareEl) return;

	const emailRect = emailEl.getBoundingClientRect();
	const dotRect = dotEl.getBoundingClientRect();
	const squareWidth = squareEl.offsetWidth || 120;
	const targetWidth = (emailRect.left - dotRect.left) + squareWidth;
	shapesEl.style.width = targetWidth + 'px';

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

	// Assign triangle color (before "connected")
	const triangleEl = document.querySelector('.shape-triangle');
	if (triangleEl) {
		triangleEl.style.color = shuffled[0];
	}

	// Assign square color (before "product experiences")
	const squareEl = document.querySelector('.shape-square');
	if (squareEl) {
		squareEl.style.backgroundColor = shuffled[1];
	}
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
