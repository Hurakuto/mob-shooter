import type {BulletData} from '../gameData/BulletData.ts';
import Entity from './Entity.ts';
import Health from "../components/Health.ts";
import Movement from "../components/Movement.ts";
import Weapon from "../components/Weapon.ts";

export default class Enemy extends Entity {
    protected readonly _bulletData: BulletData = {
        width: 12,
        height: 12,
        color: 0xf25f5c,
        speed: 512,
        damage: 1,
        shots: 1,
        angle: 0
    };
    private _shootTimerConfig: Phaser.Types.Time.TimerEventConfig;
    private _shootTimer: Phaser.Time.TimerEvent;
    protected _target: Entity;
    protected _health: Health | undefined;
    protected _healthValue: number;
    protected _speed: number;
    private readonly _directionToTarget: Phaser.Math.Vector2 = new Phaser.Math.Vector2();
    protected _frameName: string;
    protected _canShoot: boolean = false;
    public static kills: number = 0;

    public init(bulletsGroup: Phaser.Physics.Arcade.Group, target: Entity) {
        this._target = target;
        this._frameName = this.frame.name;

        this.addComponent(new Health(this._healthValue, this));
        this.addComponent(new Movement(this._speed));
        this.addComponent(new Weapon(bulletsGroup, this._bulletData));
        // Chasers don't shoot for now
        this.getComponent(Weapon)!.enabled = this._canShoot;

        // Listen once per enemy, not on every enable(): pooled enemies are reused many times
        this._health = this.getComponent(Health);
        this._health?.on(Health.CHANGE_EVENT, () => {
            this.setTintFill(0xffffff);

            if (this._health?.current == 0)
            {
                this.disableBody();
            }

            this.scene.time.delayedCall(50, () => {
                this.clearTint();

                if (this._health?.current == 0)
                {
                    this.disable();
                }
            });
        });

        // Only enemies with an enabled weapon shoot
        if (this.getComponent(Weapon)?.enabled) {
            this._shootTimerConfig = {
                delay: Phaser.Math.Between(2000, 3000),
                callback: this.shoot,
                callbackScope: this,
                loop: true
            };
            this._shootTimer = this.scene.time.addEvent(this._shootTimerConfig);
        }

        // Create animation when enemy is about to shoot in the global animation manager
        if (this._canShoot) {
            const shootAnimKey = `${this._frameName}-shoot`;
            const texture = this.scene.textures.get('sprites');
            if (texture?.has(`${this._frameName}-shoot0`) && texture?.has(`${this._frameName}-shoot1`)) {
                if (!this.scene.anims.exists(shootAnimKey)) {
                    this.scene.anims.create({
                        key: shootAnimKey,
                        frames: [
                            {key: 'sprites', frame: this._frameName},
                            {key: 'sprites', frame: `${this._frameName}-shoot0`},
                            {key: 'sprites', frame: `${this._frameName}-shoot1`}
                        ],
                        frameRate: 4,
                    });
                }
            }
        }

        this.arcadeBody.setCircle(this.displayWidth / 2);
    }

    public enable(x: number, y: number) {
        this.enableBody(true, x, y, true, true);
        this._shootTimer?.reset(this._shootTimerConfig);

        // Restore health, in case the enemy is reused from the pool, without emitting events
        const health = this.getComponent(Health);
        health?.heal(health!.max, false);
    }

    public disable() {
        Enemy.kills++;
        this.stop();
        this.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);

        this.disableBody(true, true);
        if (this._shootTimer) {
            this._shootTimer.paused = true;
        }
    }

    private shoot() {
        const shootAnimKey = `${this._frameName}-shoot`;
        if (this.scene.anims.exists(shootAnimKey)) {
            this.play(shootAnimKey);
            this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                this.setTexture('sprites', this._frameName);

                this.getComponent(Weapon)?.shoot(this);
                this.scene.sound.play('sfx_laser2');
            });
        } else {
            this.getComponent(Weapon)?.shoot(this);
            this.scene.sound.play('sfx_laser2');
        }
    }

    preUpdate(timeSinceLaunch: number, deltaTime: number) {
        super.preUpdate(timeSinceLaunch, deltaTime)

        // Direction to the target: (target - me), normalized to keep only the direction
        this._directionToTarget.set(this._target.x - this.x, this._target.y - this.y).normalize();
        this.rotation = this._directionToTarget.angle();

        if (!this.isTinted)
            this.getComponent(Movement)?.move(this, this._directionToTarget, deltaTime);
        else
            this.getComponent(Movement)?.move(this, this._directionToTarget, deltaTime * 0.5);
    }
}