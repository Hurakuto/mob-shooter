import Enemy from "../Enemy.ts";
import Entity from "../Entity.ts";

export class BasicEnemy extends Enemy {
   
    public init(bulletsGroup: Phaser.Physics.Arcade.Group, target: Entity) {
        this._healthValue = 1;
        this._speed = 0.3;

        super.init(bulletsGroup, target);
    }
}