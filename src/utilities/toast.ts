export const _renderToast = async (message: string, duration = 2000, icon = 'checkmark'): Promise<void> => {
  const toast = document.createElement('ion-toast');
  toast.message = message;
  toast.duration = duration;
  toast.icon = icon;

  document.body.appendChild(toast);
  return toast.present();
};
