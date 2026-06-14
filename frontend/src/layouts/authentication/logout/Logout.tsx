import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/auth/AuthContext";

function Logout() {
  const navigate = useNavigate();
  const [authState, authActions] = useAuth();
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Create an async function to handle the logout process
    const handleLogout = async () => {
      setIsLoggingOut(true);
      
      try {
        console.log("Logout component - starting logout process");
        
        // Manually clear localStorage as a first step
        try {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("username");
          console.log("Logout component - localStorage items removed");
        } catch (storageError) {
          console.error("Logout component - Error clearing localStorage:", storageError);
        }
        
        // Then perform the context logout action
        if (authActions && typeof authActions.logout === 'function') {
          console.log("Logout component - calling authActions.logout()");
          authActions.logout();
        } else {
          console.error("Logout component - authActions.logout is not a function", authActions);
          setError("Logout function not available");
        }
        
        // Set a timeout to ensure we always navigate regardless of logout success
        setTimeout(() => {
          if (isMounted) {
            console.log("Logout component - navigating to sign-in page");
            navigate("/authentication/sign-in");
          }
        }, 500);
        
      } catch (error) {
        console.error("Logout component - Error during logout:", error);
        setError("An error occurred during logout");
        
        // Ensure navigation happens even if there's an error
        if (isMounted) {
          setTimeout(() => {
            console.log("Logout component - navigating to sign-in page after error");
            navigate("/authentication/sign-in");
          }, 500);
        }
      } finally {
        if (isMounted) {
          setIsLoggingOut(false);
        }
      }
    };

    // Call the logout handler
    handleLogout();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [authActions, navigate]);

  // Return a simple message while logging out
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '20px' }}>
        {error ? `Error: ${error}` : "Logging out..."}
      </div>
      {isLoggingOut && (
        <div>Please wait...</div>
      )}
    </div>
  );
}

export default Logout;