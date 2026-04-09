// 사운드 파일이 아직 없으므로 안전하게 감싸는 유틸
// /public/sounds/ 폴더에 파일 추가 후 활성화

class SoundManager {
  private enabled = false;

  play(_name: string) {
    if (!this.enabled) return;
    // TODO: Howler 연동
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

export const sounds = new SoundManager();
