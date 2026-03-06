import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, MapPin, IndianRupee, Star, ArrowRight } from "lucide-react";

const features = [
  { icon: Package, title: "Post Any Errand", desc: "Need something from the market? Post it and a fellow student will grab it for you." },
  { icon: MapPin, title: "Nearby Deliverers", desc: "See who's available within 2km. Get your items delivered from local shops fast." },
  { icon: IndianRupee, title: "Earn Pocket Money", desc: "Accept errands, deliver items, and earn tips — no minimum hours, no boss." },
  { icon: Star, title: "Trusted Community", desc: "Rate and review each delivery. Only verified college students on the platform." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Package className="h-4 w-4" />
            Made for college students
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Campus{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Errand
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            Get items from local markets delivered to your hostel — or earn pocket money by delivering for others.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="gradient-primary text-primary-foreground font-semibold px-8">
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              I want to deliver
            </Button>
          </div>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-20 right-8 w-16 h-16 rounded-2xl gradient-accent opacity-20 blur-sm"
        />
        <motion.div
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-20 left-8 w-20 h-20 rounded-full gradient-primary opacity-15 blur-sm"
        />
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-lg mx-auto grid gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-card"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-lg mx-auto text-center gradient-primary rounded-2xl p-8">
          <h2 className="font-heading text-2xl font-bold text-primary-foreground mb-2">
            Ready to start?
          </h2>
          <p className="text-primary-foreground/80 mb-6">
            Join your campus community. Post or deliver errands in minutes.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-card text-foreground hover:bg-card/90 font-semibold"
          >
            Sign Up Free
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
