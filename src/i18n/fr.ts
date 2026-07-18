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
  joinWaitlist: (position: number) =>
    `La sortie est complète. Tu es sur liste d'attente à la position #${position}. Tu seras notifié si une place se libère.`,
  promotedFromWaitlist:
    "Une place s'est libérée ! Tu passes de la liste d'attente aux participants confirmés. 🚴",
  rideFull: "Cette sortie est complète et dispose d'une liste d'attente.",
  capConflict:
    "Impossible de définir le plafond : il y a moins de places que de participants confirmés.",
  weatherForecast: (
    tempMinC: number,
    tempMaxC: number,
    description: string,
    windSpeedKmph: number,
    windGustKmph: number,
    windDirection: string,
    precipitationChancePct: number,
    precipitationMm: number,
  ) =>
    `🌤️ **Météo :** ${description}, ${tempMinC}–${tempMaxC}°C, 💨 ${windSpeedKmph} km/h ${windDirection} (rafales ${windGustKmph} km/h), 🌧️ ${precipitationChancePct}% de risque de pluie${precipitationMm > 0 ? ` (${precipitationMm} mm)` : ""}`,
  weatherNotInThread: "Cette commande ne fonctionne que dans le fil d'une sortie.",
  weatherUnavailable: "La météo n'est pas disponible pour cette sortie pour le moment.",
}
