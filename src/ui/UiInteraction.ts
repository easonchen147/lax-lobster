import Phaser from 'phaser';

export const createContainerHitArea = (width: number, height: number, padding = 0): Phaser.Geom.Rectangle =>
  new Phaser.Geom.Rectangle(0, 0, width + padding * 2, height + padding * 2);

export type SceneNavigatorLike = {
  input?: { enabled: boolean };
  scene: { start: (sceneKey: string, data?: object) => void };
  sys: { isActive: () => boolean };
};

export type SceneInputLike = {
  input?: { enabled: boolean };
};

export const ensureSceneInputEnabled = (scene: SceneInputLike): void => {
  if (!scene.input) {
    return;
  }

  scene.input.enabled = true;
};

export const createSceneNavigator = (scene: SceneNavigatorLike) => {
  let navigating = false;

  return (sceneKey: string, data?: object): boolean => {
    if (navigating || !scene.sys.isActive()) {
      return false;
    }

    navigating = true;
    if (scene.input) {
      scene.input.enabled = false;
    }
    scene.scene.start(sceneKey, data);
    return true;
  };
};
