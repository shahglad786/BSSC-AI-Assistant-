import { useState, useCallback, useMemo } from 'react';

// Configuration constants
const BSSC_RPC_URL = '[https://bssc-rpc.bssc.live](https://bssc-rpc.bssc.live)';
const GEMINI_MODEL_URL = '[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent)';

// CRITICAL: Retrieve API Key from Vite's standard environment variable
// In a VITE project, environment variables prefixed with VITE_ are exposed here.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Define navigation links
const NAV_LINKS = [
  { 
    name: 'Official Website', 
    href: '[https://bssc.live/](https://bssc.live/)', 
    icon: (props) => (
      // Globe icon
      <svg {...props} xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/><path d="M12 2a14.5 14.5 0 0 1 7 5 14.5 14.5 0 0 1 3 5 14.5 14.5 0 0 1 -3 5 14.5 14.5 0 0 1 -7 5"/></svg>
    ) 
  },
  { 
    name: 'Explorer', 
    href: '[https://explorer.bssc.live/](https://explorer.bssc.live/)', 
    icon: (props) => (
      // Search icon
      <svg {...props} xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    ) 
  },
  { 
    name: 'BSSC Project GitHub', 
    href: '[https://github.com/HaidarIDK/Binance-Super-Smart-Chain](https://github.com/HaidarIDK/Binance-Super-Smart-Chain)', 
    icon: (props) => (
      // Official GitHub Logo (Octocat)
      <svg {...props} xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" ><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.082-.743.082-.727.082-.727 1.205.084 1.839 1.237 1.839 1.237 1.07 1.837 2.809 1.305 3.493.998.108-.77.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.798 24 17.292 24 12c0-6.627-5.373-12-12-12z"/></svg>
    ) 
  },
  { 
    name: 'X', 
    href: '[https://x.com/bnbsolfork](https://x.com/bnbsolfork)', 
    icon: (props) => (
      // Custom X logo SVG
      <svg {...props} viewBox="0 0 1200 1227" fill="currentColor" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path d="M714.163 519.284L1160.78 0H1055.03L667.137 450.887L357.328 0H0L484.58 757.51L0 1227H105.766L515.421 737.842L840.481 1227H1200L714.163 519.284ZM569.166 687.828L521.697 618.915L142.345 83.531H214.067L541.67 563.858L616.488 671.307L1051.8 1146.47H979.664L569.166 687.828Z"/></svg>
    ) 
  },
];

export default function App() {
  
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const [contextSource, setContextSource] = useState('Google Grounding');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Derived state to check if the AI feature is enabled via environment key
  const isAIEnabled = useMemo(() => !!apiKey, []);

  // Helper function for exponential backoff during API calls
  const fetchWithRetry = useCallback(async (url, options, maxRetries = 3) => {
    let lastError = null;
    for (let i = 0; i < maxRetries; i++) {
        try {
            if (!apiKey) {
                // Throw an error that gets caught and displayed gracefully
                throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY environment variable.");
            }
            // Append the apiKey to the URL
            const apiUrlWithKey = `${url}?key=${apiKey}`;

            const response = await fetch(apiUrlWithKey, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error ? errorData.error.message : response.statusText;
                throw new Error(`API Request Failed: ${response.status} - ${errorMessage}`);
            }
            return response;
        } catch (error) {
            lastError = error;
            const delay = Math.pow(2, i) * 1000;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
  }, []);


  // Function to fetch transaction or account details via RPC for context injection
  const fetchExplorerContext = useCallback(async (id) => {
    const isTx = id.length > 80;
    const method = isTx ? 'getTransaction' : 'getAccountInfo';
    
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: method,
        params: [id, { encoding: 'jsonParsed', commitment: 'confirmed' }],
    };

    try {
        const r = await fetch(BSSC_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await r.json();

        if (data.error) {
            console.error(`RPC Context Error for ${method}:`, data.error);
            return null;
        }

        const result = data.result;
        if (result) {
            const type = isTx ? 'Transaction' : 'Account';
            
            const contextData = {
                type: type,
                id: id,
                data: isTx ? result.transaction : result.value,
            };
            
            const contextString = JSON.stringify(contextData, null, 2);
            // Truncate to prevent context window overflow
            return `BSSC RPC Context (JSON):\n${contextString.substring(0, 5000)}... (truncated)`;
        }
        return null;

    } catch (err) {
        console.error('Failed to fetch explorer context via RPC:', err);
        return null;
    }
  }, []);


  // Function to call the Gemini API with RPC context or Google Grounding
  const handleAsk = useCallback(async () => {
    if (!input) return;

    setLoading(true);
    setResponse('');
    setBalance('');
    setSources([]);
    setContextSource('Google Grounding'); 

    let systemInstruction = '';
    let userPrompt = `User Query: ${input}`;
    const isTechnicalID = input.length > 30 && !input.includes(' ');
    
    // --- Define general clean formatting rules ---
    const generalFormattingRules = `
      --- CRITICAL INSTRUCTIONS FOR RESPONSE FORMAT ---
      1. DO NOT use any markdown formatting (NO asterisks like ***, NO bolding, NO lists, NO code blocks, NO emojis).
      2. Use only plain text.
      3. Start directly with your explanation.
      --- END CRITICAL INSTRUCTIONS ---
    `;

    try {
      let rpcContext = null;

      if (isTechnicalID) {
        rpcContext = await fetchExplorerContext(input);
      }

      if (rpcContext) {
          // RPC success path (uses the existing, strict formatting rules)
          userPrompt = `${rpcContext}\n\nUser Query: ${input}`;
          systemInstruction = `
            You are the BSSC AI Assistant. The native token for this network is BSSC.
            Your primary task is to analyze the provided BSSC RPC Context (a JSON string for a transaction or address).
            
            --- CRITICAL INSTRUCTIONS FOR RESPONSE FORMAT ---
            1. EXPLAIN THE DATA IN SIMPLE, EASY-TO-UNDERSTAND WORDS.
            2. Any value related to the native token must be referred to using the symbol BSSC.
            3. DO NOT use any markdown formatting (NO asterisks like ***, NO bolding, NO lists, NO code blocks, NO emojis).
            4. Use only plain text.
            5. Do NOT show the raw JSON or the 'BSSC RPC Context' header directly to the user.
            6. Focus only on essential details like native BSSC balance, token holdings, and major transaction activity. OMIT generic, low-value technical details about account structure (e.g., 'not an executable program,' '0 bytes data,' 'rent epoch').
            7. Start directly with your explanation.
            --- END CRITICAL INSTRUCTIONS ---
          `;
          setContextSource('BSSC RPC');
      } else {
          // RPC failure/null or general query path (now includes strict formatting rules)
          let fallbackNote = '';
          if (isTechnicalID) {
              fallbackNote = 'Note: Direct BSSC RPC data was not found for this ID. The user expects an analysis of this address/transaction. Please use the Google Search tool immediately to find context from the BSSC Explorer or related sources.';
              userPrompt = `${userPrompt}\n\n${fallbackNote}`;
          }
          
          systemInstruction = `
            You are the BSSC AI Assistant. The native token for this network is BSSC. 
            For general questions about the project, prioritize information from the official domain bssc.live. 
            For technical IDs (address/tx hash) or other queries, use the search tool to find context from the BSSC Explorer or related web sources. 
            Provide a helpful summary, answer concisely and professionally, and refer to the native token as BSSC.
            ${generalFormattingRules}
          `;
      }

      const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        tools: [{ google_search: {} }], 
        systemInstruction: {
          parts: [{ text: systemInstruction.trim() }]
        },
      };

      const aiRes = await fetchWithRetry(
        GEMINI_MODEL_URL,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      
      const data = await aiRes.json();
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || 'No response from AI.';
      
      let newSources = [];
      const groundingMetadata = candidate?.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
          newSources = groundingMetadata.groundingAttributions
              .map(attribution => ({
                  uri: attribution.web?.uri,
                  title: attribution.web?.title,
              }))
              .filter(source => source.uri && source.title);
      }

      setResponse(text);
      setSources(newSources);

    } catch (err) {
      console.error('AI Request Error:', err);
      // Display the specific key missing error or general fetch error
      setResponse(`Error: ${err.message || 'Failed to process your request. Check your VITE_GEMINI_API_KEY.'}`);
    } finally {
      setLoading(false);
    }
  }, [input, fetchExplorerContext, fetchWithRetry]);

  // Function to check the balance via BSSC RPC (direct call from frontend)
  const handleCheckBalance = useCallback(async () => {
    setLoading(true);
    setResponse('');
    setBalance('');
    setSources([]);

    try {
      if (!input || input.length < 30) {
        setBalance('Please enter a valid BSSC address (at least 30 characters long).');
        return;
      }
      
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [input],
      };

      const r = await fetch(BSSC_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await r.json();

      if (data.error) {
        setBalance(`RPC Error: ${data.error.message || 'Unknown error'}`);
      } else if (data.result?.value !== undefined) {
        // Assuming conversion from lamports to BSSC (10^9)
        const balanceValue = data.result.value / 1000000000; 
        // Explicitly display 'BSSC' for the balance check result
        setBalance(`Balance: ${balanceValue.toFixed(4)} BSSC`);
      } else {
        setBalance('Address found, but balance could not be determined.');
      }

    } catch (err) {
      console.error('RPC Request Error:', err);
      setBalance('Error: Failed to connect to the BSSC RPC server.');
    } finally {
      setLoading(false);
    }
  }, [input]);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center">
      
      {/* HEADER WITH NAVIGATION */}
      <header className="sticky top-0 z-10 w-full bg-gray-800 shadow-xl border-b border-blue-900/50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4 py-3">
          
          {/* Logo/Title */}
          <h1 className="text-xl font-extrabold text-blue-400">
            BSSC AI Assistant
          </h1>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-6">
            {NAV_LINKS.map(link => (
              <a 
                key={link.name} 
                href={link.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
              >
                <link.icon className="w-5 h-5"/>
                <span>{link.name}</span>
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-300 hover:text-blue-400 p-2 rounded-lg transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              // X icon for close
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            ) : (
              // Menu icon
              <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>
        
        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-700">
            <nav className="flex flex-col space-y-2 px-4">
              {NAV_LINKS.map(link => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-3 p-3 bg-gray-700 rounded-xl text-gray-200 hover:bg-gray-600 hover:text-blue-300 transition-colors duration-200 shadow-md"
                >
                  <link.icon className="w-5 h-5"/>
                  <span className="font-semibold">{link.name}</span>
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="w-full max-w-xl p-4 mt-8">
        
        <p className="text-center text-sm text-gray-400 mb-8">
            Enter a BSSC wallet address, transaction hash, or general project question.
        </p>

        {/* API Key Warning */}
        {!isAIEnabled && (
            <div className="mb-6 p-3 border border-red-500 rounded-xl bg-red-900/50 shadow-lg">
                <p className="text-sm text-red-300 font-semibold">
                    Warning: Gemini AI features are disabled.
                    <span className="block mt-1 font-normal">
                      Please set the **VITE_GEMINI_API_KEY** environment variable in your `.env` file (local) or hosting environment (deployment).
                    </span>
                </p>
            </div>
        )}

        <input
          type="text"
          placeholder="Enter wallet address, tx hash, or question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-4 border border-gray-600 bg-gray-700 text-white rounded-xl focus:ring-blue-500 focus:border-blue-500 mb-4 text-lg transition-all duration-300 shadow-inner"
        />
        
        <div className="flex space-x-3 mb-8">
          <button
            onClick={handleAsk}
            disabled={!input || loading || !isAIEnabled} // Disabled if key is missing
            className="flex-1 px-5 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors duration-300 shadow-lg transform hover:scale-[1.01] active:scale-95"
          >
            {loading ? 'Analyzing...' : 'Ask AI'}
          </button>
          
          <button
            onClick={handleCheckBalance}
            disabled={!input || loading}
            className="flex-1 px-5 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors duration-300 shadow-lg transform hover:scale-[1.01] active:scale-95"
          >
            {loading ? 'Checking...' : 'Check Balance (RPC)'}
          </button>
        </div>

        {/* Display Balance Result */}
        {balance && (
          <div className="mt-4 p-5 bg-gray-700 border border-green-500 rounded-xl shadow-inner">
            <h2 className="font-bold text-green-400 mb-2 text-xl">RPC Balance:</h2>
            <p className="text-lg font-mono whitespace-pre-line break-words">{balance}</p>
          </div>
        )}

        {/* Display AI Response */}
        {response && (
          <div className="mt-6 p-5 bg-gray-700 border border-blue-500 rounded-xl shadow-inner">
            <h2 className="font-bold text-blue-400 mb-3 text-xl">AI Response:</h2>
            <p className="text-gray-200 whitespace-pre-line break-words leading-relaxed">{response}</p>
            
            {sources.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Context Source: <span className="text-xs font-normal text-gray-300">{contextSource}</span></h3>
                    <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
                        {sources.map((source, index) => (
                            <li key={index}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 break-all">
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {!sources.length && contextSource === 'BSSC RPC' && (
                <div className="mt-5 pt-4 border-t border-gray-600">
                    <h3 className="text-sm font-semibold text-gray-400 mb-1">Context Source: <span className="text-xs font-normal text-gray-300">BSSC RPC</span></h3>
                </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto py-6 text-sm text-gray-500 text-center border-t border-gray-700 w-full">
        <div className="max-w-xl mx-auto px-4">
          <p className="text-gray-400 font-medium mb-1">© 2025 BSSC Project. All Rights Reserved.</p>
          <p className="text-gray-500">Powered by Gemini 2.5 Flash + BSSC RPC</p>
        </div>
      </footer>
    </div>
  );
}
