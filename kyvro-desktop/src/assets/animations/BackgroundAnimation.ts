import * as THREE from 'three';
import { gsap } from 'gsap';

export class BackgroundAnimation {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private torus!: THREE.Mesh;
  private animationId: number | null = null;
  private container: HTMLElement;
  private mouse: THREE.Vector2;

  constructor(container: HTMLElement) {
    this.container = container;
    this.mouse = new THREE.Vector2();
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
    this.camera.position.z = 10;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Create 3D objects
    this.createTorus();
    this.createParticles();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x8b5cf6, 1, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3b82f6, 1, 100);
    pointLight2.position.set(-10, -10, 10);
    this.scene.add(pointLight2);

    // Mouse interaction
    this.setupMouseInteraction();

    // Start animation
    this.animate();
  }

  private createTorus() {
    const geometry = new THREE.TorusGeometry(3, 1, 16, 100);
    const material = new THREE.MeshPhongMaterial({
      color: 0x8b5cf6,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.1,
      shininess: 100,
      specular: 0x3b82f6,
      wireframe: false,
      opacity: 0.8,
      transparent: true
    });

    this.torus = new THREE.Mesh(geometry, material);
    this.scene.add(this.torus);

    // Animate torus entrance
    gsap.from(this.torus.scale, {
      duration: 2,
      x: 0,
      y: 0,
      z: 0,
      ease: "elastic.out(1, 0.3)"
    });

    gsap.from(this.torus.rotation, {
      duration: 3,
      x: Math.PI * 2,
      y: Math.PI * 2,
      ease: "power2.out"
    });
  }

  private createParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Create spherical distribution
      const radius = 5 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      // Color gradient from purple to blue
      const colorChoice = Math.random();
      const color = new THREE.Color();
      if (colorChoice < 0.5) {
        color.setHSL(0.75, 0.8, 0.5 + Math.random() * 0.3); // Purple
      } else {
        color.setHSL(0.6, 0.8, 0.5 + Math.random() * 0.3); // Blue
      }
      
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;

      sizes[i / 3] = Math.random() * 0.1 + 0.05;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + sin(time + position.x) * 0.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;
          
          float opacity = 1.0 - (dist * 2.0);
          gl_FragColor = vec4(vColor, opacity * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);

    // Animate particles entrance
    gsap.from(this.particles.scale, {
      duration: 2.5,
      x: 0,
      y: 0,
      z: 0,
      ease: "elastic.out(1, 0.3)",
      delay: 0.5
    });
  }

  private setupMouseInteraction() {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Update camera position based on mouse
      gsap.to(this.camera.position, {
        duration: 1,
        x: this.mouse.x * 2,
        y: this.mouse.y * 2,
        ease: "power2.out"
      });

      // Rotate torus based on mouse
      gsap.to(this.torus.rotation, {
        duration: 1,
        x: this.mouse.y * Math.PI * 0.5,
        y: this.mouse.x * Math.PI * 0.5,
        ease: "power2.out"
      });
    };

    this.container.addEventListener('mousemove', handleMouseMove);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Rotate torus
    this.torus.rotation.x += 0.005;
    this.torus.rotation.y += 0.007;

    // Animate particles
    this.particles.rotation.y += 0.001;
    this.particles.rotation.x += 0.0005;

    // Update shader uniforms
    if (this.particles.material instanceof THREE.ShaderMaterial) {
      this.particles.material.uniforms.time.value = time;
    }

    // Pulsing effect for torus
    const scale = 1 + Math.sin(time * 2) * 0.05;
    this.torus.scale.set(scale, scale, scale);

    // Floating particles
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] += Math.sin(time + positions[i] * 0.5) * 0.002;
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }

  public playPulseAnimation() {
    gsap.timeline()
      .to(this.torus.scale, {
        duration: 0.3,
        x: 1.2,
        y: 1.2,
        z: 1.2,
        ease: "power2.out"
      })
      .to(this.torus.scale, {
        duration: 0.5,
        x: 1,
        y: 1,
        z: 1,
        ease: "elastic.out(1, 0.3)"
      });

    // Particle burst
    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    const originalPositions = [...positions];
    
    gsap.to(positions, {
      duration: 1,
      "0": positions.map((_, i) => originalPositions[i] + (Math.random() - 0.5) * 3),
      ease: "power2.out",
      onUpdate: () => {
        this.particles.geometry.attributes.position.needsUpdate = true;
      },
      onComplete: () => {
        gsap.to(positions, {
          duration: 1.5,
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
      } else if (object instanceof THREE.Points) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });
  }
}
