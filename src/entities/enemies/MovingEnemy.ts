import Enemy from "../Enemy.ts";
import Movement from "../../components/Movement.ts";

export class MovingEnemy extends Enemy {
    private _direction: boolean;
    private _offset: number = 65;

    init(bulletsGroup: Phaser.Physics.Arcade.Group) {
        this._speed = 0.1;
        super.init(bulletsGroup);
    }
    preUpdate(timeSinceLaunch: number, deltaTime: number) {
            super.preUpdate(timeSinceLaunch, deltaTime)

            if(this._direction) this.x -= 5;
            else this.x += 5;
    
            // Destroy entities when out of screen
            if (this.y > this.scene.cameras.main.height + this.displayHeight) {
                this.disable();
            }

            if(this.x > this.scene.cameras.main.width - this._offset || this.x < 0 + this._offset) this._direction = !this._direction;
    
            if (!this.isTinted)
                this.getComponent(Movement)?.moveVertically(this, deltaTime);
            else
                this.getComponent(Movement)?.moveVertically(this, deltaTime * 0.5);
        }
}