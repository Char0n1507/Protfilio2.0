import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'

// DOM Elements
const canvasContainer = document.getElementById('bg-canvas');
const skillsSection = document.getElementById('skills');

// Scene Setup
const scene = new THREE.Scene();
// No background color set here, we let CSS handle the dark navy, and canvas is transparent?
// Actually better to set it here to match CSS var --bg-navy #0a192f
scene.background = new THREE.Color('#0a192f');
scene.fog = new THREE.Fog('#0a192f', 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

const renderer = new THREE.WebGLRenderer({ canvas: canvasContainer, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- PARTICLE BACKGROUND (Stars) ---
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 60; // Spread wide
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: '#64ffda', // Teal stars
    transparent: true,
    opacity: 0.5,
});
const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);


// --- 3D SKILLS OBJECTS (Hidden initially) ---
const skillsGroup = new THREE.Group();
scene.add(skillsGroup);

// Create some geometries to represent "Building Blocks" of code
const geoms = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TetrahedronGeometry(1, 0),
    new THREE.BoxGeometry(1.2, 1.2, 1.2),
];

// Wireframe material for tech look
const skillMat = new THREE.MeshBasicMaterial({
    color: '#64ffda',
    wireframe: true,
    transparent: true,
    opacity: 0.3
});

const skillObjects = [];

for (let i = 0; i < 6; i++) {
    const geom = geoms[i % geoms.length];
    const mesh = new THREE.Mesh(geom, skillMat);

    // Position them randomly around center
    mesh.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
    );

    // Give random rotation speed
    mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.02,
        rotY: (Math.random() - 0.5) * 0.02,
    };

    skillsGroup.add(mesh);
    skillObjects.push(mesh);
}

// Position the whole group off-screen or scaled down initially
skillsGroup.position.set(0, 0, -20); // Far away
skillsGroup.visible = false;


// --- LIGHTS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight('#64ffda', 1);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);


// --- INTERACTION ---
let mouseX = 0;
let mouseY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth - 0.5;
    mouseY = e.clientY / window.innerHeight - 0.5;
});

window.addEventListener('scroll', () => {
    // Check if Skills section is in view
    const rect = skillsSection.getBoundingClientRect();
    const isVisible = (rect.top < window.innerHeight && rect.bottom >= 0);

    if (isVisible) {
        if (!skillsGroup.visible) {
            skillsGroup.visible = true;
            gsap.to(skillsGroup.position, { z: 5, duration: 2, ease: "power2.out" }); // Fly in
            gsap.to(skillsGroup.rotation, { y: Math.PI, duration: 2 }); // Spin in
        }
    } else {
        if (skillsGroup.visible && skillsGroup.position.z > 0) {
            gsap.to(skillsGroup.position, { z: -20, duration: 1, onComplete: () => { skillsGroup.visible = false; } });
        }
    }
});


// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // 1. Rotate Particles (Background)
    particlesMesh.rotation.y = elapsedTime * 0.05;
    particlesMesh.rotation.x = mouseY * 0.1;
    particlesMesh.rotation.y += mouseX * 0.1;

    // 2. Animate Skills Objects (if visible)
    if (skillsGroup.visible) {
        skillsGroup.rotation.y += 0.005; // Slow group rotation

        skillObjects.forEach(obj => {
            obj.rotation.x += obj.userData.rotX;
            obj.rotation.y += obj.userData.rotY;
        });

        // Parallax for skills
        skillsGroup.rotation.x = mouseY * 0.5;
        skillsGroup.rotation.z = mouseX * 0.5;
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};


// --- SCROLL REVEAL & UI LOGIC ---
const setupUI = () => {
    // 1. Mobile Menu
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');
    const navLinks = document.querySelectorAll('.mobile-nav-links a');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
        });
    }

    if (closeMenu) {
        closeMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });


    // 2. Scroll Reveal Animation
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Animates only once
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => observer.observe(el));
};

setupUI();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

tick();
