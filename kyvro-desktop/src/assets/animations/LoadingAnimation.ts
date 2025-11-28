import * as THREE from 'three';
import { gsap } from 'gsap';

export class LoadingAnimation {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cubes: THREE.Mesh[] = [];
  private particles!: THREE.Points;
  private animationId: number | null = null;
  private container: HTMLElement;
  private progress: number = 0;

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
    this.camera.position.z = 15;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Create loading elements
    this.createLoadingCubes();
    this.createLoadingParticles();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x8b5cf6, 2, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 2, 100);
    pointLight2.position.set(-10, -10, 10);
    this.scene.add(pointLight2);

    // Start animation
    this.animate();
  }

  private createLoadingCubes() {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    
    for (let i = 0; i < 8; i++) {
      const material = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0x8b5cf6 : 0x3b82f6,
        emissive: i % 2 === 0 ? 0x8b5cf6 : 0x3b82f6,
        emissiveIntensity: 0.2,
        shininess: 100,
        specular: 0xffffff
      });

      const cube = new THREE.Mesh(cubeGeometry, material);
      
      // Arrange cubes in a circle
      const angle = (i / 8) * Math.PI * 2;
      const radius = 5;
      cube.position.x = Math.cos(angle) * radius;
      cube.position.y = Math.sin(angle) * radius;
      cube.position.z = 0;
      
      this.cubes.push(cube);
      this.scene.add(cube);

      // Initial entrance animation
      gsap.from(cube.position, {
        duration: 1,
        z: -10,
        ease: "power3.out",
        delay: i * 0.1
      });

      gsap.from(cube.scale, {
        duration: 0.5,
        x: 0,
        y: 0,
        z: 0,
        ease: "back.out(1.7)",
        delay: i * 0.1
      });
    }
  }

  private createLoadingParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Create circular distribution around cubes
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 4;
      
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = Math.sin(angle) * radius;
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
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    gsap.from(this.particles.scale, {
      duration: 2,
      x: 0,
      y: 0,
      z: 0,
      ease: "elastic.out(1, 0.3)",
      delay: 0.5
    });
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Rotate cubes in circle
    this.cubes.forEach((cube, index) => {
      const angle = (index / 8) * Math.PI * 2 + time * 0.5;
      const radius = 5 + Math.sin(time + index) * 0.5;
      
      gsap.to(cube.position, {
        duration: 0.1,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        ease: "none"
      });

      // Individual cube rotation
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.03;

      // Pulsing based on progress
      const scale = 1 + Math.sin(time * 3 + index) * 0.2 * (this.progress / 100);
      gsap.to(cube.scale, {
        duration: 0.1,
        x: scale,
        y: scale,
        z: scale,
        ease: "none"
      });
    });

    // Rotate particles
    this.particles.rotation.z += 0.005;

    // Camera orbit
    const cameraAngle = time * 0.2;
    this.camera.position.x = Math.cos(cameraAngle) * 20;
    this.camera.position.z = Math.sin(cameraAngle) * 20;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  public updateProgress(progress: number) {
    this.progress = progress;

    // Update cube colors based on progress
    this.cubes.forEach((cube, index) => {
      const cubeProgress = (progress / 100) * 8;
      if (index < cubeProgress) {
        (cube.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
        (cube.material as THREE.MeshPhongMaterial).color.setHex(0x10b981); // Green when complete
      } else {
        (cube.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;
        (cube.material as THREE.MeshPhongMaterial).color.setHex(index % 2 === 0 ? 0x8b5cf6 : 0x3b82f6);
      }
    });

    // Particle burst effect at milestones
    if (progress % 25 === 0 && progress > 0) {
      this.createParticleBurst();
    }
  }

  private createParticleBurst() {
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const originalPositions = [...positions];
    
    gsap.to(positions, {
      duration: 0.5,
      "0": positions.map((_, i) => {
        const burst = Math.random() * 2;
        return originalPositions[i] + (Math.random() - 0.5) * burst;
      }),
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

  public playCompletionAnimation() {
    const timeline = gsap.timeline();
    
    // All cubes turn green and form a circle
    this.cubes.forEach((cube, index) => {
      timeline.to(cube.material as THREE.MeshPhongMaterial, {
        duration: 0.3,
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.8,
        ease: "power2.out"
      }, index * 0.05);

      // Form final circle
      const angle = (index / 8) * Math.PI * 2;
      const radius = 6;
      
      timeline.to(cube.position, {
        duration: 0.5,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: 0,
        ease: "power2.inOut"
      }, index * 0.05);
    });

    // Final celebration
    timeline
      .to(this.cubes.map(cube => cube.scale), {
        duration: 0.3,
        x: 1.5,
        y: 1.5,
        z: 1.5,
        ease: "power2.out"
      }, "-=0.5")
      .to(this.cubes.map(cube => cube.scale), {
        duration: 0.5,
        x: 1,
        y: 1,
        z: 1,
        ease: "elastic.out(1, 0.3)"
      })
      .call(() => this.createParticleBurst());

    // Camera pull back
    timeline.to(this.camera.position, {
      duration: 1,
      z: 25,
      ease: "power2.inOut"
    }, "-=1");
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
      } else if (object instanceof THREE.Points) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
