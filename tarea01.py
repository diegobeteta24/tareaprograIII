import graphviz

class Nodo:
    def __init__(self, nombre, apellido, carnet):
        self.nombre = nombre
        self.apellido = apellido
        self.carnet = carnet
        self.siguiente = None
        self.anterior = None

class ListaDoblementeEnlazada:
    def __init__(self):
        self.cabeza = None

    def insertar_al_principio(self, nombre, apellido, carnet):
        nuevo_nodo = Nodo(nombre, apellido, carnet)
        if not self.cabeza:
            self.cabeza = nuevo_nodo
        else:
            nuevo_nodo.siguiente = self.cabeza
            self.cabeza.anterior = nuevo_nodo
            self.cabeza = nuevo_nodo

    def insertar_al_final(self, nombre, apellido, carnet):
        nuevo_nodo = Nodo(nombre, apellido, carnet)
        if not self.cabeza:
            self.cabeza = nuevo_nodo
        else:
            actual = self.cabeza
            while actual.siguiente:
                actual = actual.siguiente
            actual.siguiente = nuevo_nodo
            nuevo_nodo.anterior = actual

    def eliminar_por_valor(self, carnet):
        actual = self.cabeza
        while actual:
            if actual.carnet == carnet:
                if actual.anterior:
                    actual.anterior.siguiente = actual.siguiente
                if actual.siguiente:
                    actual.siguiente.anterior = actual.anterior
                if actual == self.cabeza:
                    self.cabeza = actual.siguiente
                return
            actual = actual.siguiente

    def mostrar_lista(self):
        lista = "None <- "
        actual = self.cabeza
        while actual:
            lista += f"{actual.nombre} {actual.apellido} ({actual.carnet}) <-> "
            actual = actual.siguiente
        lista += "None"
        print(lista)

    def generar_grafo(self):
        grafo = graphviz.Digraph('G', filename='Milista.gv')
        grafo.attr(rankdir='LR')
        grafo.attr('node', shape='box')

        actual = self.cabeza
        while actual:
            grafo.node(str(actual.carnet), f"{actual.nombre} {actual.apellido}\n({actual.carnet})")
            if actual.anterior:
                grafo.edge(str(actual.anterior.carnet), str(actual.carnet))
            actual = actual.siguiente

        grafo.view()

def menu():
    print("Hola, este es un sistema para alumnos")
    lista = ListaDoblementeEnlazada()

    while True:
        print("\nOpciones para el programa:")
        print("1. Insertar al principio de la lista")
        print("2. Insertar al final de la lista")
        print("3. Eliminar por carnet de estudiante")
        print("4. Mostrar lista con la grafica")
        print("5. Salir del programa")

        opcion = input("Seleccione una opción: ")

        if opcion == '1':
            nombre = input("Ingrese el nombre: ")
            apellido = input("Ingrese el apellido: ")
            carnet = input("Ingrese el carnet: ")
            lista.insertar_al_principio(nombre, apellido, carnet)
            lista.mostrar_lista()
            lista.generar_grafo()
        elif opcion == '2':
            nombre = input("Ingrese el nombre: ")
            apellido = input("Ingrese el apellido: ")
            carnet = input("Ingrese el carnet: ")
            lista.insertar_al_final(nombre, apellido, carnet)
            lista.mostrar_lista()
            lista.generar_grafo()
        elif opcion == '3':
            carnet = input("Ingrese el carnet a eliminar: ")
            lista.eliminar_por_valor(carnet)
            lista.mostrar_lista()
            lista.generar_grafo()
        elif opcion == '4':
            lista.mostrar_lista()
            lista.generar_grafo()
        elif opcion == '5':
            print("Has decidido salir, adios")
            break
        else:
            print("Intenta de nuevo")

if __name__ == "__main__":
    menu()
