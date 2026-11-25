import Enemy from "../Enemy.ts";

class MovingEnemey extends Enemy {
    init(bulletsGroup: Phaser.Physics.Arcade.Group) {
        super.init(bulletsGroup);
    }
}