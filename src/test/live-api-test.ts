/**
 * Live API Test Script
 * 
 * Test real API endpoints with actual credentials
 * Run with: npx tsx src/test/live-api-test.ts
 */

// Use fetch instead of axios for Node.js compatibility
const AUTH_API = 'https://vega-identity-api-dev.allianceitsc.com';
const CHAT_API = 'https://vega-chat-api-dev.allianceitsc.com';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    identifier: string;
    roles: string[];
  };
}

interface ConversationListResponse {
  items: Array<{
    id: string;
    name: string;
    type: string;
    memberCount: number;
    unreadCount: number;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}

interface MessageListResponse {
  items: Array<{
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    sentAt: string;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}

async function testLogin(email: string, password: string): Promise<string | null> {
  console.log(`\nTesting Login with: ${email}`);
  console.log(`   POST ${AUTH_API}/auth/login`);
  
  try {
    const response = await fetch(`${AUTH_API}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: email,
        password: password,
      }),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log(`   Error:`, data);
      return null;
    }
    
    console.log(`   Login successful!`);
    console.log(`   User ID: ${data.user?.id || 'N/A'}`);
    console.log(`   Identifier: ${data.user?.identifier || 'N/A'}`);
    console.log(`   Token (first 50 chars): ${data.accessToken?.substring(0, 50)}...`);
    
    return data.accessToken;
  } catch (error) {
    console.log(`   Network Error:`, error);
    return null;
  }
}

async function testGetGroups(token: string): Promise<void> {
  console.log(`\nTesting Get Groups`);
  console.log(`   GET ${CHAT_API}/api/groups`);
  
  try {
    const response = await fetch(`${CHAT_API}/api/groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`   Error Response:`, text.substring(0, 500));
      return;
    }
    
    try {
      const data = JSON.parse(text);
      console.log(`   Groups fetched!`);
      console.log(`   Total items: ${data.items?.length || 0}`);
      if (data.items?.length > 0) {
        console.log(`   First group: ${JSON.stringify(data.items[0], null, 2)}`);
      }
    } catch {
      console.log(`   Response (raw): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   Network Error:`, error);
  }
}

async function testGetConversations(token: string): Promise<string | null> {
  console.log(`\nTesting Get Conversations (DM)`);
  console.log(`   GET ${CHAT_API}/api/conversations`);
  
  try {
    const response = await fetch(`${CHAT_API}/api/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`   Error Response:`, text.substring(0, 500));
      return null;
    }
    
    try {
      const data: ConversationListResponse = JSON.parse(text);
      console.log(`   Conversations fetched!`);
      console.log(`   Total items: ${data.items?.length || 0}`);
      if (data.items?.length > 0) {
        console.log(`   First conversation: ${JSON.stringify(data.items[0], null, 2)}`);
        return data.items[0].id;
      }
    } catch {
      console.log(`   Response (raw): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   Network Error:`, error);
  }
  
  return null;
}

async function testGetMessages(token: string, conversationId: string): Promise<void> {
  console.log(`\nTesting Get Messages`);
  console.log(`   GET ${CHAT_API}/api/conversations/${conversationId}/messages`);
  
  try {
    const response = await fetch(`${CHAT_API}/api/conversations/${conversationId}/messages?limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`   Error Response:`, text.substring(0, 500));
      return;
    }
    
    try {
      const data: MessageListResponse = JSON.parse(text);
      console.log(`   Messages fetched!`);
      console.log(`   Total items: ${data.items?.length || 0}`);
      console.log(`   Has more: ${data.hasMore}`);
      if (data.items?.length > 0) {
        console.log(`   Latest message: ${JSON.stringify(data.items[0], null, 2)}`);
      }
    } catch {
      console.log(`   Response (raw): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   Network Error:`, error);
  }
}

async function testSendMessageToGroup(token: string, groupId: string): Promise<void> {
  console.log(`\nTesting Send Message to GROUP (via /api/messages)`);
  console.log(`   POST ${CHAT_API}/api/messages`);
  
  const testMessage = {
    conversationId: groupId,
    content: `Test message from live-api-test at ${new Date().toISOString()}`,
  };
  
  console.log(`   Body: ${JSON.stringify(testMessage)}`);
  
  try {
    const response = await fetch(`${CHAT_API}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(testMessage),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`   Error Response:`, text.substring(0, 500));
      return;
    }
    
    try {
      const data = JSON.parse(text);
      console.log(`   Message sent to group!`);
      console.log(`   Message ID: ${data.id}`);
      console.log(`   Content: ${data.content}`);
    } catch {
      console.log(`   Response (raw): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   Network Error:`, error);
  }
}

async function testSendMessage(token: string, conversationId: string): Promise<void> {
  console.log(`\nTesting Send Message (via /api/messages)`);
  console.log(`   POST ${CHAT_API}/api/messages`);
  
  const testMessage = {
    conversationId: conversationId,
    content: `Test message from live-api-test at ${new Date().toISOString()}`,
  };
  
  console.log(`   Body: ${JSON.stringify(testMessage)}`);
  
  try {
    const response = await fetch(`${CHAT_API}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(testMessage),
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`   Error Response:`, text.substring(0, 500));
      return;
    }
    
    try {
      const data = JSON.parse(text);
      console.log(`   Message sent!`);
      console.log(`   Message ID: ${data.id}`);
      console.log(`   Content: ${data.content}`);
    } catch {
      console.log(`   Response (raw): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   Network Error:`, error);
  }
}

async function testGetGroupMessages(token: string, groupId: string): Promise<void> {
  console.log(`\nTesting Get Group Messages`);
  console.log(`   GET ${CHAT_API}/api/groups/${groupId}/messages`);
  
  try {
    const response = await fetch(`${CHAT_API}/api/groups/${groupId}/messages?limit=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`   Error Response:`, text.substring(0, 500));
      return;
    }
    
    try {
      const data: MessageListResponse = JSON.parse(text);
      console.log(`   Group Messages fetched!`);
      console.log(`   Total items: ${data.items?.length || 0}`);
      console.log(`   Has more: ${data.hasMore}`);
      if (data.items?.length > 0) {
        console.log(`   Latest message: ${JSON.stringify(data.items[0], null, 2)}`);
      }
    } catch {
      console.log(`   Response (raw): ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   Network Error:`, error);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('LIVE API TEST');
  console.log('='.repeat(60));
  console.log(`Auth API: ${AUTH_API}`);
  console.log(`Chat API: ${CHAT_API}`);
  
  // Test with user credentials
  const credentials = [
    { email: 'user@quoc-nam.com', password: 'User@123' },
  ];
  
  for (const cred of credentials) {
    console.log('\n' + '='.repeat(60));
    console.log(`Testing with: ${cred.email}`);
    console.log('='.repeat(60));
    
    // 1. Login
    const token = await testLogin(cred.email, cred.password);
    
    if (!token) {
      console.log(`\nSkipping further tests due to login failure`);
      continue;
    }
    
    // 2. Get Groups and test with first group
    console.log(`\nTesting Get Groups`);
    console.log(`   GET ${CHAT_API}/api/groups`);
    
    const groupsResponse = await fetch(`${CHAT_API}/api/groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const groupsData = await groupsResponse.json();
    console.log(`   Status: ${groupsResponse.status}`);
    console.log(`   Total groups: ${groupsData.items?.length || 0}`);
    
    if (groupsData.items?.length > 0) {
      const firstGroup = groupsData.items[0];
      console.log(`   First group ID: ${firstGroup.id}`);
      console.log(`   First group name: ${firstGroup.name}`);
      
      // Test get group messages
      await testGetGroupMessages(token, firstGroup.id);
      
      // Test send message to group
      await testSendMessageToGroup(token, firstGroup.id);
      
      // Get messages again to verify
      await testGetGroupMessages(token, firstGroup.id);
    }
    
    // 3. Get Conversations (DM)
    const conversationId = await testGetConversations(token);
    
    if (conversationId) {
      // 4. Get Messages
      await testGetMessages(token, conversationId);
      
      // 5. Send Message to DM
      await testSendMessage(token, conversationId);
    }
    
    console.log('\nTests completed for:', cred.email);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('ALL TESTS COMPLETED');
  console.log('='.repeat(60));
}

main().catch(console.error);
