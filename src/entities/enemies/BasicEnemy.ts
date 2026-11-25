import Enemy from "../Enemy.ts";

class BasicEnemy extends Enemy {
    init(bulletsGroup: Phaser.Physics.Arcade.Group) {
        super.init(bulletsGroup);
    }
}