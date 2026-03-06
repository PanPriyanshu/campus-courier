import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, IndianRupee, Users, ArrowRight } from "lucide-react";

const features = [
  { icon: Package, title: "Request Anything", desc: "Pens, medicines, snacks — from shops nearby your campus" },
  { icon: IndianRupee, title: "Earn Pocket Money", desc: "Pick up errands and earn ₹30-100 per delivery" },
  { icon: Users, title: "Students Only", desc: "Verified college students. Safe & trusted community" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto flex flex-col items-center"
      >
        {/* App Icon */}
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 shadow-lg">
          <Package className="h-10 w-10 text-primary-foreground" />
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl font-bold text-center mb-3">
          <span className="text-primary">Campus</span>{" "}
          <span className="text-secondary">Errand</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-center text-base leading-relaxed mb-10">
          Get offline items delivered by fellow students.
          <br />
          Earn pocket money on your schedule.
        </p>

        {/* Feature Cards */}
        <div className="w-full space-y-3 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border shadow-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-card-foreground text-[15px]">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => navigate("/auth")}
          className="w-full gradient-primary text-primary-foreground font-semibold text-base h-12 rounded-xl"
        >
          Get Started <ArrowRight className="h-4 w-4 ml-1" />
        </Button>

        <p className="text-sm text-muted-foreground mt-4">
          Free for all college students in India 🇮🇳
        </p>
      </motion.div>
    </div>
  );
};

export default Landing;
