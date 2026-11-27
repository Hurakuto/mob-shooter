import Enemy from "../Enemy.ts";
import Entity from "../Entity.ts";


export class BossEnemy extends Enemy {
    
    public init(bulletsGroup: Phaser.Physics.Arcade.Group, target: Entity) {
        this._healthValue = 20;
        this._speed = 0.1;
        this._canShoot = true;
        this._bulletData.shots = 5;
        this._bulletData.angle = 90;

        super.init(bulletsGroup, target);
    }
}