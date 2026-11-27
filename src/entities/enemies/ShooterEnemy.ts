import Enemy from "../Enemy.ts";
import Entity from "../Entity.ts";

export class ShooterEnemy extends Enemy {

    public init(bulletsGroup: Phaser.Physics.Arcade.Group, target: Entity) {
        this._healthValue = 3;
        this._speed = 0.2;

        super.init(bulletsGroup, target);
    }
}