import { EventWithRelations } from '@/types/event';

const GOOGLE_CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export async function addEventToGoogleCalendar(event: EventWithRelations, jwtToken: string) {
  try {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 4); // Assuming events last 4 hours by default

    const eventDetails = {
      summary: event.title || 'Evento Nakafin',
      description: `
        Empresa: ${event.responsiblePerson.companyName}
        Responsável: ${event.responsiblePerson.name}
        Telefone: ${event.responsiblePerson.phoneNumber}
        Local: ${event.location.parent ? `${event.location.parent.name} - ${event.location.name}` : event.location.name}
        Participantes: ${event.participantsQuantity}
        Cardápio: ${event.menu.title}
        ${event.description ? `\nObservações: ${event.description}` : ''}
      `.trim(),
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      location: event.location.parent 
        ? `${event.location.parent.name} - ${event.location.name}`
        : event.location.name,
    };

    // First, get the access token from the JWT
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Now use the access token to create the event
    const response = await fetch(GOOGLE_CALENDAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventDetails),
    });

    if (!response.ok) {
      throw new Error('Failed to add event to Google Calendar');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding event to Google Calendar:', error);
    throw error;
  }
}

export function initiateGoogleAuth() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/auth/google/callback`;
  const scope = 'https://www.googleapis.com/auth/calendar.events';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  window.location.href = authUrl;
} 