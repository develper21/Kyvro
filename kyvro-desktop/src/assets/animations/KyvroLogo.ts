import * as THREE from 'three';
import { gsap } from 'gsap';

export class KyvroLogoAnimation {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private logo!: THREE.Group;
  private particles!: THREE.Points;
  private animationId: number | null = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e1e2e);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Create logo
    this.createLogo();
    
    // Create particles
    this.createParticles();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x8b5cf6, 1);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 1);
    pointLight2.position.set(-5, -5, 5);
    this.scene.add(pointLight2);

    // Start animation
    this.animate();
  }

  private createLogo() {
    this.logo = new THREE.Group();

    // Create main logo geometry (stylized "K")
    const logoMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b5cf6,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.2,
      shininess: 100,
      specular: 0x3b82f6
    });

    // K shape using boxes
    const kGeometry = new THREE.BoxGeometry(0.3, 3, 0.3);
    const kVertical = new THREE.Mesh(kGeometry, logoMaterial);
    kVertical.position.set(-1, 0, 0);
    this.logo.add(kVertical);

    // K diagonal parts
    const diagonalGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
    const kDiagonal1 = new THREE.Mesh(diagonalGeometry, logoMaterial);
    kDiagonal1.position.set(0, 0.5, 0);
    kDiagonal1.rotation.z = Math.PI / 6;
    this.logo.add(kDiagonal1);

    const kDiagonal2 = new THREE.Mesh(diagonalGeometry, logoMaterial);
    kDiagonal2.position.set(0, -0.5, 0);
    kDiagonal2.rotation.z = -Math.PI / 6;
    this.logo.add(kDiagonal2);

    // Add glowing effect
    const glowGeometry = new THREE.SphereGeometry(2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.1
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.logo.add(glow);

    this.scene.add(this.logo);

    // Initial animation
    gsap.from(this.logo.scale, {
      duration: 2,
      x: 0,
      y: 0,
      z: 0,
      ease: "elastic.out(1, 0.3)"
    });

    gsap.from(this.logo.rotation, {
      duration: 3,
      y: Math.PI * 2,
      ease: "power2.out"
    });
  }

  private createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 10;

      // Purple to blue gradient
      const color = new THREE.Color();
      color.setHSL(0.75 + Math.random() * 0.15, 0.8, 0.5 + Math.random() * 0.3);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Rotate logo
    this.logo.rotation.y += 0.005;

    // Animate particles
    if (this.particles) {
      this.particles.rotation.y += 0.001;
      this.particles.rotation.x += 0.0005;

      // Floating animation
      const positions = this.particles.geometry.attributes.position.array as Float32Array;
      const time = Date.now() * 0.001;
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + positions[i]) * 0.001;
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public playIntroAnimation() {
    // Staggered entrance animation
    const timeline = gsap.timeline();
    
    timeline
      .from(this.logo.position, {
        duration: 1.5,
        y: -5,
        ease: "power3.out"
      })
      .from(this.logo.rotation, {
        duration: 2,
        y: Math.PI * 4,
        ease: "power2.out"
      }, "-=1")
      .to(this.logo.scale, {
        duration: 0.5,
        x: 1.2,
        y: 1.2,
        z: 1.2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: 1
      }, "-=0.5")
      .from(this.particles.scale, {
        duration: 2,
        x: 0,
        y: 0,
        z: 0,
        ease: "elastic.out(1, 0.3)"
      }, "-=1.5");
  }

  public playHoverAnimation() {
    gsap.to(this.logo.scale, {
      duration: 0.3,
      x: 1.1,
      y: 1.1,
      z: 1.1,
      ease: "power2.out"
    });

    gsap.to(this.particles.rotation, {
      duration: 0.5,
      y: this.particles.rotation.y + Math.PI / 4,
      ease: "power2.inOut"
    });
  }

  public playClickAnimation() {
    const timeline = gsap.timeline();
    
    timeline
      .to(this.logo.scale, {
        duration: 0.1,
        x: 0.9,
        y: 0.9,
        z: 0.9,
        ease: "power2.in"
      })
      .to(this.logo.scale, {
        duration: 0.2,
        x: 1.3,
        y: 1.3,
        z: 1.3,
        ease: "elastic.out(1, 0.3)"
      })
      .to(this.logo.scale, {
        duration: 0.3,
        x: 1,
        y: 1,
        z: 1,
        ease: "power2.out"
      });

    // Particle burst effect
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const originalPositions = [...positions];
    
    gsap.to(positions, {
      duration: 1,
      "0": positions.map((_, i) => originalPositions[i] + (Math.random() - 0.5) * 2),
      ease: "power2.out",
      onUpdate: () => {
        this.particles.geometry.attributes.position.needsUpdate = true;
      },
      onComplete: () => {
        gsap.to(positions, {
          duration: 1,
          "0": originalPositions,
          ease: "power2.inOut",
          onUpdate: () => {
            this.particles.geometry.attributes.position.needsUpdate = true;
          }
        });
      }
    });
  }

  public resize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    this.container.removeChild(this.renderer.domElement);
    this.renderer.dispose();
    
    // Clean up geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
