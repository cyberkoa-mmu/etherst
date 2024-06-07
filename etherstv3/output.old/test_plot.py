
import matplotlib.pyplot as plt

# Sample data
trust = [2, 4, 6, 8, 3, 5, 7, 1, 9]
untrust = [3, 6, 9, 2, 5, 8, 1, 4, 7]
balance = [100, 250, 150, 300, 200, 400, 350, 450, 500]

# Creating the scatter plot
plt.scatter(trust, untrust, s=balance, c='blue', alpha=0.5)

# Adding labels and title
plt.xlabel('Trust')
plt.ylabel('Untrust')
plt.title('Trust and Untrust Relationship')

# Displaying the plot
plt.show()
