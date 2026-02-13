import * as THREE from 'three';

export class Flower {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Parameters
        this.petalColor = 0xff4d6d;
        this.stemColor = 0x69b578;
        this.centerColor = 0xffd700;
        
        this.petals = [];
        this.leaves = [];
        
        this.initMesh();
    }

    initMesh() {
        // 1. Stem
        // Simple cylinder for now, anchored at the bottom
        const stemGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
        stemGeo.translate(0, 1.5, 0); // Move pivot to bottom
        const stemMat = new THREE.MeshStandardMaterial({ color: this.stemColor, roughness: 0.8 });
        this.stem = new THREE.Mesh(stemGeo, stemMat);
        this.stem.castShadow = true;
        this.stem.scale.set(0, 0, 0); // Start hidden
        this.group.add(this.stem);

        // 2. Flower Center
        const centerGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const centerMat = new THREE.MeshStandardMaterial({ color: this.centerColor });
        this.center = new THREE.Mesh(centerGeo, centerMat);
        this.center.position.y = 3;
        this.center.scale.set(0, 0, 0);
        this.stem.add(this.center); // Attach to stem tip

        // 3. Petals
        const petalCount = 8;
        const petalGeo = new THREE.SphereGeometry(0.5, 16, 16);
        petalGeo.scale(0.5, 1, 0.2); // Flatten to make petal shape
        petalGeo.translate(0, 0.5, 0); // Move pivot to bottom of petal

        const petalMat = new THREE.MeshStandardMaterial({ 
            color: this.petalColor, 
            side: THREE.DoubleSide,
            emissive: 0xaa0033,
            emissiveIntensity: 0.1
        });

        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const angle = (i / petalCount) * Math.PI * 2;
            
            // Position circle around center
            petal.rotation.y = angle;
            
            // Initial closed rotation (pointing up)
            petal.rotation.z = 0.2; // Slight tilt
            
            // We need a pivot object to rotate the petal outward easily from the center
            const pivot = new THREE.Object3D();
            pivot.rotation.y = angle;
            pivot.add(petal);
            
            this.center.add(pivot);
            this.petals.push({ mesh: petal, pivot: pivot, initialZ: 0.2, targetZ: Math.PI / 4 + 0.5 });
        }
        
        // 4. Leaves (Simple flattened spheres)
        const leafGeo = new THREE.SphereGeometry(0.3, 8, 8);
        leafGeo.scale(1, 0.1, 0.4);
        leafGeo.rotateY(Math.PI / 4);
        const leafMat = new THREE.MeshStandardMaterial({ color: this.stemColor });
        
        const leaf1 = new THREE.Mesh(leafGeo, leafMat);
        leaf1.position.set(0, 1, 0);
        leaf1.rotation.z = Math.PI / 4;
        leaf1.scale.set(0,0,0);
        this.stem.add(leaf1);
        this.leaves.push(leaf1);

        const leaf2 = new THREE.Mesh(leafGeo, leafMat);
        leaf2.position.set(0, 1.5, 0);
        leaf2.rotation.z = -Math.PI / 4;
        leaf2.scale.set(0,0,0);
        this.stem.add(leaf2);
        this.leaves.push(leaf2);
    }

    animate(time) {
        // Time in seconds
        
        // Phase 1: Stem Growth (0 - 2 seconds)
        const stemProgress = Math.min(Math.max(time / 2, 0), 1);
        const easeStem = this.easeOutElastic(stemProgress);
        this.stem.scale.set(1, easeStem, 1);

        // Phase 2: Petal Blooming (1.5 - 3.5 seconds)
        const bloomProgress = Math.min(Math.max((time - 1.5) / 2, 0), 1);
        const easeBloom = this.easeInOutCubic(bloomProgress);
        
        if (bloomProgress > 0) {
            this.center.scale.set(1, 1, 1); // Pop center
            
            this.petals.forEach((p, i) => {
                // Rotate petals outward
                // Start at initialZ (pointing up), rotate to targetZ (pointing out/diagonal)
                const currentZ = THREE.MathUtils.lerp(p.initialZ, p.targetZ + Math.PI/4, easeBloom);
                p.mesh.rotation.x = currentZ; 
            });
            
             // Leaves
             this.leaves.forEach(l => {
                 l.scale.set(1 + easeBloom * 0.5, 1, 1 + easeBloom * 0.5);
             });
        }
    }

    // Easing functions
    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
    
    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
}
