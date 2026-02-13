import * as THREE from 'three';

export class HeartParticles {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        heartShape.moveTo( x + 5, y + 5 );
        heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
        heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
        heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
        heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
        heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
        heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

        const geometry = new THREE.ExtrudeGeometry( heartShape, { depth: 2, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 } );
        geometry.center();
        geometry.scale(0.02, 0.02, 0.02); // Small hearts
        
        this.geometry = geometry;
        this.material = new THREE.MeshStandardMaterial({ 
            color: 0xff4d6d, 
            emissive: 0xff0000, 
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
    }

    explode(position, count = 50) {
        for(let i=0; i<count; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.material.clone()); // Clone material to handle fade out if needed
            mesh.position.copy(position);
            
            // Random velocity upwards and outwards
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 2 + Math.random() * 5;
            
            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.abs(Math.cos(phi)) * 2, // Bias upwards
                Math.sin(phi) * Math.sin(theta)
            ).multiplyScalar(speed);
            
            this.scene.add(mesh);
            
            // Random rotation
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            
            this.particles.push({ 
                mesh, 
                velocity, 
                rotationSpeed: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5),
                age: 0,
                lifespan: 3 + Math.random() * 2
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += dt;
            
            p.mesh.position.addScaledVector(p.velocity, dt);
            
            p.mesh.rotation.x += p.rotationSpeed.x * dt * 5;
            p.mesh.rotation.y += p.rotationSpeed.y * dt * 5;
            p.mesh.rotation.z += p.rotationSpeed.z * dt * 5;
            
            // Gravity
            p.velocity.y -= 3 * dt;
            
            // Fade out/Shrink
           // p.mesh.scale.multiplyScalar(0.99);
            
            if (p.age > p.lifespan) {
                this.scene.remove(p.mesh);
                // Dispose geometry/material not strictly needed for this small scale but good practice
                p.mesh.material.dispose(); 
                this.particles.splice(i, 1);
            }
        }
    }
}
