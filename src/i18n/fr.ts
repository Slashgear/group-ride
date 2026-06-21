export const messages = {
  memberLeft: "Un membre a quitté la sortie.",
  rideUpdated: "Les détails de la sortie ont été mis à jour.",
  rideOver: "La sortie est terminée. Ce fil est maintenant en lecture seule.",
  rideCancelled: (date: string, meetingPoint: string) =>
    `La sortie du ${date} (${meetingPoint}) a été annulée.`,
  dayBeforeReminder: (meetingPoint: string, meetingTime?: string) =>
    `🚴 **Rappel** — la sortie de demain${meetingTime == null ? "" : ` à **${meetingTime}**`} ! Point de rendez-vous : **${meetingPoint}**`,
  hourBeforeReminder: (meetingPoint: string, meetingTime: string) =>
    `⏰ **Plus qu'une heure !** Rendez-vous à **${meetingPoint}** à **${meetingTime}**. 🚴`,
  joinSuccess: "Tu es inscrit ! Rejoins le fil de la sortie. 🚴",
  alreadyMember: "Tu es déjà inscrit à cette sortie.",
  rideNotActive: "Cette sortie a été annulée.",
  rideNotFound: "Cette sortie n'existe plus.",
  unexpectedError: "Une erreur est survenue. Réessaie.",
  leftRide: "Tu as quitté la sortie.",
  rideCancelledConfirm: "Sortie annulée.",
  rideAlreadyCancelled: "Cette sortie a déjà été annulée.",
  rideUpdatedConfirm: (date: string) => `✅ Sortie mise à jour pour le ${date} !`,
  rideCancelledTelegram: "✅ La sortie a été annulée et le groupe notifié.",
  joinSuccessTelegram: "Tu es inscrit ! Rejoins le sujet de la sortie. 🚴",
}
