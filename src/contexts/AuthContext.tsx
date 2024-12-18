import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

interface AuthUser extends User {
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Auth state changed - User:", user.email, "PhotoURL:", user.photoURL);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        
        // Update user with both Firebase Auth and Firestore data
        setUser({ 
          ...user, 
          role: userData?.role,
          photoURL: userData?.avatarUrl || user.photoURL // Prioritize Firestore avatarUrl
        });

        if (!user.emailVerified) {
          toast({
            title: "Email verification required",
            description: "Please check your inbox and verify your email to access all features.",
            duration: 10000,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  const sendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      try {
        console.log("Sending verification email to:", auth.currentUser.email);
        await sendEmailVerification(auth.currentUser);
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and verify your email address.",
          duration: 5000,
        });
      } catch (error) {
        console.error("Error sending verification email:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send verification email. Please try again.",
        });
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      setUser({ ...user, role: userData?.role });

      if (!user.emailVerified) {
        await sendVerificationEmail();
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log("Registering new user:", email);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email immediately after registration
      await sendEmailVerification(user);
      
      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email,
        name,
        role: "user",
        createdAt: new Date(),
      });
      
      setUser({ ...user, role: "user" });
      
      toast({
        title: "Account created successfully",
        description: "Please check your inbox and verify your email address to access all features.",
        duration: 10000,
      });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    sendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}