export const sightings = [
  {
    id: 'SIGHTING_001',
    location: 'Grand Central Terminal, NYC',
    status: 'CONFIRMED',
    summary: 'Subject stood motionless on main concourse for 22 minutes',
    content: `Barron Trump observed standing motionless on the main concourse, staring directly at the ceiling's constellation mural. Witnesses report he stood there for 22 minutes without moving. When approached by terminal security, he said: "Orion is late tonight." He then walked directly to Track 117. There is no Track 117 at Grand Central. There was no footage of him leaving.`
  },
  {
    id: 'SIGHTING_002',
    location: 'Denver International Airport, Concourse B',
    status: 'UNVERIFIED',
    summary: 'Figure observed near Blue Mustang statue at 3:33 AM',
    content: `TSA agent reports seeing a tall figure matching Barron's description near the infamous "Blue Mustang" statue at an hour when the airport was closed. Figure appeared to be taking notes. Upon approach, figure was no longer present. Agent's bodycam shows 4 minutes of static during the encounter window. Agent has requested transfer.`
  },
  {
    id: 'SIGHTING_003',
    location: 'Hoover Dam, Nevada',
    status: 'CONFIRMED',
    summary: 'Subject dropped metallic object into spillway',
    content: `Tour group reported Barron Trump standing alone at an observation point closed to the public. Park ranger confirmed visual ID. Subject was observed dropping something into the spillway—witnesses describe a small metallic object. Object was never recovered. The dam's acoustic monitoring equipment registered an unusual vibration for the following 66 seconds.`
  },
  {
    id: 'SIGHTING_004',
    location: 'Fairbanks, Alaska',
    status: 'CONFIRMED',
    summary: 'Unauthorized visitor in magnetometer facility',
    content: `Staff at the Geophysical Institute reported an unauthorized visitor in the magnetometer facility. Security footage shows Barron Trump standing before a display of real-time aurora data. He appeared to be speaking. To what, unclear. The magnetometer registered a spike at 11:11:11 PM. The spike's waveform, when converted to audio, produced a tone matching B-flat. Barron's birth note, according to one conspiracy theorist.`
  },
  {
    id: 'SIGHTING_005',
    location: 'Sedona, Arizona — Airport Mesa Vortex',
    status: 'UNVERIFIED',
    summary: 'Subject observed at vortex site surrounded by stones',
    content: `Hikers reported a tall young man sitting cross-legged at the vortex site, surrounded by a circle of small stones. Each stone was equidistant. Each stone was a different color. As the sun crested the horizon, the young man stood, pocketed one stone, and descended via a trail that doesn't appear on any map. Hikers attempted to follow. Trail ended at a solid rock face.`
  },
  {
    id: 'SIGHTING_006',
    location: 'Svalbard Global Seed Vault, Norway',
    status: 'UNVERIFIED',
    summary: 'Unscheduled visitor with pre-construction clearance codes',
    content: `Norwegian facility staff reported an unscheduled visitor with American security clearance codes that "predated the vault's construction." No photo ID on file. Biometric scan returned: "PROFILE ARCHIVED." Visitor requested access to Section 66. Vault records do not acknowledge a Section 66. Visitor was not seen exiting. Facility logs show normal activity for the entire day.`
  },
  {
    id: 'SIGHTING_007',
    location: 'Roswell, New Mexico — International UFO Museum',
    status: 'CONFIRMED',
    summary: 'Subject accessed staff-only storage for 17 minutes',
    content: `Security guard confirms Barron Trump visited the museum alone. He bypassed all exhibits and proceeded directly to a storage room marked "Staff Only." He remained inside for exactly 17 minutes. When staff entered after his departure, nothing appeared missing or disturbed. However, one display mannequin had been repositioned to face the east wall. It had been facing north for 11 years.`
  },
  {
    id: 'SIGHTING_008',
    location: 'Cheyenne Mountain Complex, Colorado',
    status: 'CLASSIFIED',
    summary: '[CONTENT EXPUNGED BY REQUEST OF NORAD LIAISON]',
    content: `[CONTENT EXPUNGED BY REQUEST OF NORAD LIAISON] ... partial clearance granted... subject observed in corridor 4-D... requested access to legacy ARPANET terminal... access granted by authorization code not on file... terminal active for 3 minutes... transmission destination: UNKNOWN... subject departed via... [REMAINING CONTENT EXPUNGED]`
  },
  {
    id: 'SIGHTING_009',
    location: 'Point Nemo, Pacific Ocean (via satellite)',
    status: 'UNVERIFIED',
    summary: 'Human-sized thermal anomaly at Earth\'s most remote point',
    content: `Maritime monitoring satellite captured thermal anomaly at Earth's most remote point. Coordinates exact. Anomaly appeared human-sized. Duration: 66 seconds. No vessels within 500 miles. Satellite operator flagged image. Image was reclassified within the hour. Operator's security clearance was upgraded. She doesn't know why. She didn't ask.`
  },
  {
    id: 'SIGHTING_010',
    location: 'Vatican Archives, Rome',
    status: 'UNVERIFIED',
    summary: 'Unauthorized presence in restricted archives',
    content: `Swiss Guard reported unauthorized presence in the restricted archives. No alarm triggered. No lock disturbed. Morning inventory revealed one item had been accessed: a sealed letter from 1888, author unknown, addressed to "The Boy Who Waits." The letter was still sealed. But the wax appeared fresh. As if recently re-sealed.`
  }
];

export const getRandomSighting = () => {
  return sightings[Math.floor(Math.random() * sightings.length)];
};

export const generateFakeTimestamp = () => {
  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * 120) + 1;
  const fakeTime = new Date(now.getTime() - minutesAgo * 60000);

  const hours = fakeTime.getHours();
  const minutes = fakeTime.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${minutes} ${ampm} ET`;
};

export const getStatusColor = (status) => {
  switch(status) {
    case 'CONFIRMED': return 'text-green-400 border-green-400';
    case 'UNVERIFIED': return 'text-yellow-400 border-yellow-400';
    case 'CLASSIFIED': return 'text-red-400 border-red-400';
    default: return 'text-gray-400 border-gray-400';
  }
};
