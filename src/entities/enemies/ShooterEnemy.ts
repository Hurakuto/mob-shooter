import Enemy from "../Enemy.ts";
import Entity from "../Entity.ts";

class ShooterEnemy extends Enemy {

    public init(bulletsGroup, target) {
        this._healthValue = 3;
        this._speed = 0.2;

        super.init(bulletsGroup, target);
    }
}